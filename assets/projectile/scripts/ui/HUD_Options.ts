import { _decorator, Component, Node, ToggleContainer, EditBox, Toggle, EventTouch, sys, Vec3 } from 'cc';
import { Bullet } from '../Bullet';
import { Cannon } from '../Cannon';
import { Cursor } from '../Cursor';

const { ccclass, property } = _decorator;

/**
 * HUD 选项
 */
@ccclass('HUD_Options')
export class HUD_Options extends Component {

    @property({ type: Node })
    protected content: Node = null;

    @property({ type: Node })
    protected arrow: Node = null;

    @property({ type: ToggleContainer })
    protected cannonModeToggleContainer: ToggleContainer = null;

    @property({ type: EditBox })
    protected cannonAngleEditBox: EditBox = null;

    @property({ type: EditBox })
    protected cannonVelocityEditBox: EditBox = null;

    @property({ type: Toggle })
    protected cannonTrajectoryToggle: Toggle = null;

    @property({ type: Toggle })
    protected bulletExplodeToggle: Toggle = null;

    @property({ type: Toggle })
    protected cursorAdaptToggle: Toggle = null;

    @property({ type: Cannon })
    protected cannon: Cannon = null;

    @property({ type: Cursor })
    protected cursor: Cursor = null;

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
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /**
     * 反注册事件
     */
    protected unregisterEvent() {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /**
     * 触摸回调
     * @param event 
     */
    protected onTouchEnd(event: EventTouch) {
        this.changeState(!this.content.active);
    }

    /**
     * 初始化
     */
    protected init() {
        // 适配手机
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            this.node.setScale(new Vec3(2, 2, 1));
        } else {
            this.node.setScale(new Vec3(1, 1, 1));
        }
        // 状态
        this.changeState(true);
        // 大炮模式
        const mode = Cannon.Mode[this.cannon.mode],
            toggles = this.cannonModeToggleContainer.toggleItems;
        for (let i = 0; i < toggles.length; i++) {
            if (toggles[i].node.name === mode)
                toggles[i].isChecked = true;
        }
        // 大炮角度
        this.cannonAngleEditBox.string = this.cannon.fixedPitchAngle.toString();
        this.cannonAngleEditBox.placeholder = this.cannon.fixedPitchAngle.toString();
        // 大炮速度
        this.cannonVelocityEditBox.string = this.cannon.fixedVelocity.toString();
        this.cannonVelocityEditBox.placeholder = this.cannon.fixedVelocity.toString();
        // 大炮绘制弹道
        this.cannonTrajectoryToggle.isChecked = this.cannon.showTrajectory;
        // 炮弹爆炸
        this.bulletExplodeToggle.isChecked = Bullet.triggerExplode;
        // 光标适应表面
        this.cursorAdaptToggle.isChecked = this.cursor.adaptToSurface;
        // 状态
        this.changeState(false);
    }

    /**
     * 改变状态
     * @param show 
     */
    protected changeState(show: boolean) {
        this.content.active = show;
        this.arrow.angle = show ? 180 : 0;
    }

    /**
     * 大炮模式选择回调
     * @param toggle 
     */
    protected onCannonModeToggleChanged(toggle: Toggle) {
        const value = this.cannonModeToggleContainer.activeToggles()[0].node.name;
        switch (value) {
            case 'FIXED_ALL': {
                this.cannon.mode = Cannon.Mode.FIXED_ALL;
                this.cannonAngleEditBox.node.parent.active = true;
                this.cannonVelocityEditBox.node.parent.active = true;
                break;
            }
            case 'FIXED_PITCH_ANGLE': {
                this.cannon.mode = Cannon.Mode.FIXED_PITCH_ANGLE;
                this.cannonAngleEditBox.node.parent.active = true;
                this.cannonVelocityEditBox.node.parent.active = false;
                break;
            }
            case 'FIXED_VELOCITY': {
                this.cannon.mode = Cannon.Mode.FIXED_VELOCITY;
                this.cannonAngleEditBox.node.parent.active = false;
                this.cannonVelocityEditBox.node.parent.active = true;
                break;
            }
            case 'UNFIXED': {
                this.cannon.mode = Cannon.Mode.UNFIXED;
                this.cannonAngleEditBox.node.parent.active = false;
                this.cannonVelocityEditBox.node.parent.active = false;
                break;
            }
        }
    }

    /**
     * 大炮角度输入框回调
     * @param editBox 
     */
    protected onCannonAngleEditBoxChanged(editBox: EditBox) {
        const value = Number(this.cannonAngleEditBox.string);
        if (isNaN(value) || value > 0) {
            this.cannonAngleEditBox.string = this.cannon.fixedPitchAngle.toString();
            return;
        }
        this.cannon.fixedPitchAngle = value;
    }

    /**
     * 大炮速度输入框回调
     * @param editBox 
     */
    protected onCannonVelocityEditBoxChanged(editBox: EditBox) {
        const value = Number(this.cannonVelocityEditBox.string);
        if (isNaN(value) || value <= 0) {
            this.cannonVelocityEditBox.string = this.cannon.fixedVelocity.toString();
            return;
        }
        this.cannon.fixedVelocity = value;
    }

    /**
     * 大炮绘制弹道复选框回调
     * @param toggle 
     */
    protected onCannonTrajectoryToggleChanged(toggle: Toggle) {
        const value = this.cannonTrajectoryToggle.isChecked;
        this.cannon.showTrajectory = value;
    }

    /**
     * 炮弹爆炸复选框回调
     * @param toggle 
     */
    protected onBulletExplodeToggleChanged(toggle: Toggle) {
        const value = this.bulletExplodeToggle.isChecked;
        Bullet.triggerExplode = value;
    }

    /**
     * 光标适应表面复选框回调
     * @param toggle 
     */
    protected onCursorAdaptToggleChanged(toggle: Toggle) {
        const value = this.cursorAdaptToggle.isChecked;
        this.cursor.adaptToSurface = value;
    }

}
