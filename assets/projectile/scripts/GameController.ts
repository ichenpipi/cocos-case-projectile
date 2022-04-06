import { _decorator, Component, Node, input, Input, EventTouch, Camera, Vec2, PhysicsSystem, EventMouse, sys } from 'cc';
import { DEV, PREVIEW } from 'cc/env';
import { Cannon } from './Cannon';
import { Cursor } from './Cursor';

const { ccclass, property } = _decorator;

/**
 * 游戏控制器
 */
@ccclass('GameController')
export class GameController extends Component {

    @property({ type: Camera, displayName:  '摄像机' })
    protected camera: Camera = null;

    @property({ type: Cannon, displayName:  '大炮' })
    protected cannon: Cannon = null;

    @property({ type: Cursor, displayName:  '光标' })
    protected cursor: Cursor = null;

    /**
     * 生命周期
     */
    protected onLoad() {
        this.registerEvent();
        // debug
        PREVIEW && (window['gameController'] = this);
    }

    /**
     * 生命周期
     */
    protected onDestroy() {
        this.unregisterEvent();
    }

    /**
     * 注册事件
     */
    protected registerEvent() {
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            // 手机
            input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
            input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        } else {
            // 电脑
            input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
            input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
            input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        }
    }

    /**
     * 反注册事件
     */
    protected unregisterEvent() {
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            // 手机
            input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
            input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        } else {
            // 电脑
            input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
            input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        }
    }

    /**
     * 触摸回调
     * @param event 
     */
    protected onTouchStart(event: EventTouch) {
        if (event.getAllTouches().length > 1) {
            return;
        }
        this.aimWithScreenPos(event.getLocation());
    }

    /**
     * 触摸回调
     * @param event 
     */
    protected onTouchMove(event: EventTouch) {
        if (event.getAllTouches().length > 1) {
            return;
        }
        this.aimWithScreenPos(event.getLocation());
    }

    /**
     * 触摸回调
     * @param event 
     */
    protected onTouchEnd(event: EventTouch) {
        if (event.getAllTouches().length > 0) {
            return;
        }
        this.aimWithScreenPos(event.getLocation());
        this.fire();
    }

    /**
     * 鼠标回调
     * @param event 
     */
    protected onMouseDown(event: EventMouse) {
        this.aimWithScreenPos(event.getLocation());
    }

    /**
     * 鼠标回调
     * @param event 
     */
    protected onMouseMove(event: EventMouse) {
        this.aimWithScreenPos(event.getLocation());
    }

    /**
     * 鼠标回调
     * @param event 
     */
    protected onMouseUp(event: EventMouse) {
        this.fire();
    }

    /**
     * 瞄准
     * @param screenPos 屏幕空间下的坐标
     */
    protected aimWithScreenPos(screenPos: Vec2) {
        // 创建射线
        const ray = this.camera.screenPointToRay(screenPos.x, screenPos.y);
        // 射线投射
        if (!PhysicsSystem.instance.raycastClosest(ray)) {
            return;
        }

        // 获取点击位置
        const raycastClosest = PhysicsSystem.instance.raycastClosestResult;
        // 击中点的坐标
        const hitPoint = raycastClosest.hitPoint;
        // 击中面的法线
        const hitNormal = raycastClosest.hitNormal;

        // 控制大炮
        this.cannon.aim(hitPoint);
        // 控制光标
        this.cursor.set(hitPoint, hitNormal);
    }

    /**
     * 开火
     */
    protected fire() {
        this.cannon.fire();
    }

}
