import { _decorator, Component, Node, Label, sys, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * HUD 提示
 */
@ccclass('HUD_Tips')
export class HUD_Tips extends Component {

    @property({ type: Label })
    protected label: Label = null;

    /**
     * 生命周期
     */
    protected onLoad() {
        this.init();
    }

    /**
     * 初始化
     */
    protected init() {
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            this.node.setScale(new Vec3(1.5, 1.5, 1));
            this.label.string = '双指滑动可以调整摄像机距离';
        } else {
            this.node.setScale(new Vec3(1, 1, 1));
            this.label.string = '鼠标滚轮可以调整摄像机距离';
        }
    }

}
