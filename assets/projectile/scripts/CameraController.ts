import { _decorator, Component, Node, input, Input, EventMouse, Vec3, sys, EventTouch, Vec2 } from 'cc';
import { MathUtil } from './utils/MathUtil';

const { ccclass, property } = _decorator;

/**
 * 摄像机控制器
 */
@ccclass('CameraController')
export class CameraController extends Component {

    @property({ type: Node, displayName: '摄像机节点' })
    protected cameraNode: Node = null;

    @property({ type: Node, displayName: '目标节点' })
    protected targetNode: Node = null;

    @property({ displayName: '最小距离' })
    protected minDistance: number = 5;

    @property({ displayName: '最大距离' })
    protected maxDistance: number = 50;

    @property({ displayName: '平滑时间' })
    protected smoothTime: number = 0.1;

    @property({ displayName: '鼠标滚轮敏感度' })
    protected mouseSensitivity: number = 0.05;

    @property({ displayName: '双指触摸敏感度' })
    protected touchSensitivity: number = 0.05;

    /**
     * 当前值
     */
    protected currentValue: number = 0;

    /**
     * 目标值
     */
    protected targetValue: number = 0;

    /**
     * 当前速度
     */
    protected currentVelocity: number = 0;

    /**
     * 上一次双指滑动距离
     */
    protected lastTouchesDistance: number = null;

    /**
     * 临时变量
     */
    protected tempVec3: Vec3 = new Vec3();

    /**
     * 生命周期
     */
    protected onLoad() {
        this.init();
        this.registerEvent();
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
            input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        } else {
            // 电脑
            input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }
    }

    /**
     * 反注册事件
     */
    protected unregisterEvent() {
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            // 手机
            input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        } else {
            // 电脑
            input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }
    }

    /**
     * 初始化
     */
    protected init() {
        // 摄像机看向目标节点
        this.cameraNode.lookAt(this.targetNode.getWorldPosition());
        // 设置初始距离
        let distance: number;
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            distance = 15;
        } else {
            distance = 8;
        }
        this.setTarget(distance);
    }

    /**
     * 鼠标滚轮滚动回调
     * @param event 
     */
    protected onMouseWheel(event: EventMouse) {
        const scroll = event.getScrollY() * this.mouseSensitivity;
        this.setTarget(this.targetValue - scroll);
    }

    /**
     * 触摸移动回调
     * @param event 
     */
    protected onTouchMove(event: EventTouch) {
        const touches = event.getAllTouches();
        if (touches.length < 2) {
            return;
        }
        // 使用两个触摸点的距离差值来进行缩放
        const touchesDistance = Vec2.distance(touches[0].getLocation(), touches[1].getLocation());
        if (this.lastTouchesDistance !== null) {
            const diff = (touchesDistance - this.lastTouchesDistance) * this.touchSensitivity;
            this.setTarget(this.targetValue - diff);
        }
        this.lastTouchesDistance = touchesDistance;
    }

    /**
     * 触摸结束回调
     * @param event 
     */
    protected onTouchEnd(event: EventTouch) {
        this.lastTouchesDistance = null;
    }

    /**
     * 生命周期
     * @param dt 
     */
    protected update(dt: number) {
        if (this.currentValue === this.targetValue) {
            return;
        }
        // 平滑插值
        const current = MathUtil.smoothDamp(this.currentValue, this.targetValue, this.currentVelocity, this.smoothTime);
        // 更新速度
        this.currentVelocity = current.velocity;
        // 更新距离
        this.setCurrent(current.value);
    }

    /**
     * 设置当前值
     * @param value 值
     */
    protected setCurrent(value: number) {
        // 根据距离计算相机坐标
        const direction = Vec3.subtract(this.tempVec3, this.cameraNode.getWorldPosition(), this.targetNode.getWorldPosition());
        direction.normalize().multiplyScalar(value);
        this.cameraNode.setWorldPosition(direction);
        // 记录当前值
        this.currentValue = value;
    }

    /**
     * 设置目标值
     * @param value 值
     */
    public setTarget(value: number) {
        // 记录目标值
        this.targetValue = MathUtil.clamp(value, this.minDistance, this.maxDistance);
    }

}
