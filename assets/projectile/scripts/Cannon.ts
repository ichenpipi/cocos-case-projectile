import { _decorator, Component, Node, Prefab, Vec3, instantiate, director, RigidBody, Enum } from 'cc';
import { EDITOR } from 'cc/env';
import { ProjectileMath } from './ProjectileMath';
import { TrajectoryDrawer } from './TrajectoryDrawer';
import { VectorUtil } from './utils/VectorUtil';

const { ccclass, property } = _decorator;

/**
 * 模式
 */
enum Mode {
    /** 固定角度和速度 */
    FIXED_ALL = 1,
    /** 固定俯仰角 */
    FIXED_PITCH_ANGLE = 2,
    /** 固定速度 */
    FIXED_VELOCITY = 3,
    /** 不固定角度和速度 */
    UNFIXED = 4,
}

/**
 * 大炮
 */
@ccclass('Cannon')
export class Cannon extends Component {

    @property({ type: Node, displayName: '偏航轴节点', group: { name: '自身节点引用', id: '1' } })
    protected yawAxis: Node = null;

    @property({ type: Node, displayName: '俯仰轴节点', group: { name: '自身节点引用', id: '1' } })
    protected pitchAxis: Node = null;

    @property({ type: Node, displayName: '炮弹发射点节点', group: { name: '自身节点引用', id: '1' } })
    protected firePoint: Node = null;

    @property({ type: Prefab, displayName: '炮弹预制体', group: { name: '炮弹', id: '2' } })
    protected bulletPrefab: Prefab = null;

    @property({ type: Enum(Mode), displayName: '模式', group: { name: '模式', id: '3' } })
    public mode: Mode = Mode.FIXED_PITCH_ANGLE;

    @property({ displayName: '炮管的俯仰角', visible() { return (this.mode === Mode.FIXED_PITCH_ANGLE || this.mode === Mode.FIXED_ALL); }, group: { name: '模式', id: '3' } })
    public fixedPitchAngle: number = -45;

    @property({ displayName: '炮弹的初速度', visible() { return (this.mode === Mode.FIXED_VELOCITY || this.mode === Mode.FIXED_ALL); }, group: { name: '模式', id: '3' } })
    public fixedVelocity: number = 5;

    @property({ displayName: '使用小俯仰角', visible() { return (this.mode === Mode.FIXED_VELOCITY); }, group: { name: '模式', id: '3' } })
    public useSmallPitchAngle: boolean = false;

    @property({ type: TrajectoryDrawer, displayName: '弹道绘制器', group: { name: '弹道', id: '4' } })
    protected trajectoryDrawer: TrajectoryDrawer = null;

    @property
    protected _showTrajectory: boolean = true;
    @property({ displayName: '绘制弹道', visible() { return (this.trajectoryDrawer != null); }, group: { name: '弹道', id: '4' } })
    public get showTrajectory() {
        return this._showTrajectory;
    }
    public set showTrajectory(value) {
        this._showTrajectory = value;
        if (!EDITOR && this.trajectoryDrawer) {
            if (value) {
                this.curTargetPos && this.aim(this.curTargetPos);
            } else {
                this.trajectoryDrawer.clear();
            }
        }
    }

    /**
     * 速度
     */
    protected velocity: number = 0;

    /**
     * 俯仰角
     */
    public get pitch() {
        return this.pitchAxis.eulerAngles.x;
    }
    protected set pitch(value: number) {
        this.pitchAxis.setRotationFromEuler(value, 0, 0);
    }

    /**
     * 偏航角
     */
    public get yaw() {
        return this.yawAxis.eulerAngles.y;
    }
    protected set yaw(value: number) {
        this.yawAxis.setRotationFromEuler(0, value, 0);
    }

    /**
     * 大炮的世界坐标
     */
    protected get mainPosition() {
        return this.yawAxis.getWorldPosition();
    }

    /**
     * 大炮的正前方向向量（+z）
     */
    protected get mainForward() {
        return this.yawAxis.parent.forward.negative();
    }

    /**
     * 大炮的正上方向向量（+y）
     */
    protected get mainUp() {
        return this.yawAxis.up;
    }

    /**
     * 模式
     */
    public static get Mode() {
        return Mode;
    }

    /**
     * 当前瞄准的目标位置
     */
    protected curTargetPos: Vec3 = new Vec3(0, -2, 2);

    /**
     * 旋转至指定角度
     * @param pitch 俯仰角
     * @param yaw 偏航角
     */
    public rotateTo(pitch: number, yaw: number) {
        this.pitch = pitch;
        this.yaw = yaw;
    }

    /**
     * 瞄准
     * @param targetPos 目标位置
     */
    public aim(targetPos: Vec3) {
        // 保存另作他用
        this.curTargetPos.set(targetPos);

        // 偏航角（Yaw）
        // 大炮直接看向目标点的方向矢量
        const direction = Vec3.subtract(new Vec3, targetPos, this.mainPosition);
        // 计算方向矢量和大炮的向前矢量之间的夹角（有符号）
        const yawAngle = -VectorUtil.signedAngle(direction, this.mainForward, this.mainUp);

        // 俯仰角（Pitch）和速度
        let pitchAngle = NaN,
            velocity = NaN;
        let fixedTrajectoryDistance = false;
        switch (this.mode) {
            // 固定角度和速度
            case Mode.FIXED_ALL: {
                pitchAngle = this.fixedPitchAngle;
                velocity = this.fixedVelocity;
                // 固定弹道计算的水平位移
                fixedTrajectoryDistance = true;
                break;
            }
            // 固定角度
            case Mode.FIXED_PITCH_ANGLE: {
                pitchAngle = this.fixedPitchAngle;
                // 计算速度时以斜向上的角度为正
                velocity = this.calculateVelocity(targetPos, -pitchAngle);
                break;
            }
            // 固定速度
            case Mode.FIXED_VELOCITY: {
                velocity = this.fixedVelocity;
                // 计算角度
                const { angle1, angle2 } = this.calculateAngle(targetPos, velocity);
                if (!isNaN(angle1) && !isNaN(angle2)) {
                    // 能够到达，选择大角度还是小角度
                    if (this.useSmallPitchAngle) {
                        pitchAngle = -Math.min(angle1, angle2);
                    } else {
                        pitchAngle = -Math.max(angle1, angle2);
                    }
                } else {
                    // 固定弹道计算的水平位移
                    fixedTrajectoryDistance = true;
                }
                break;
            }
            // 不固定角度和速度
            case Mode.UNFIXED: {
                const result = this.calculateWithMaxHeight(targetPos);
                pitchAngle = -result.angle;
                velocity = result.velocity;
                break;
            }
        }

        // 角度值是否有效
        if (isNaN(pitchAngle)) {
            pitchAngle = this.pitch;    // 维持当前角度
        }
        // 旋转
        this.rotateTo(pitchAngle, yawAngle);

        // 记录速度
        if (!isNaN(velocity)) {
            this.velocity = velocity;
        }

        // 绘制弹道
        if (this.showTrajectory && this.trajectoryDrawer) {
            this.drawTrajectory(targetPos, -this.pitch, this.velocity, fixedTrajectoryDistance);
        }
    }

    /**
     * 开火
     * @param targetPos 
     */
    public fire(targetPos?: Vec3) {
        // 瞄准
        targetPos && this.aim(targetPos);
        // 发射
        this.shoot(this.velocity);
    }

    /**
     * 发射
     * @param velocity 初始速度
     */
    protected shoot(velocity: number) {
        // 获取炮弹
        const bulletNode = this.generateBullet(),
            bulletRigidBody = bulletNode.getComponent(RigidBody);
        // 方向和速度（默认前方为 -z 方向，需要反过来）
        const direction = bulletNode.forward.negative();
        direction.multiplyScalar(velocity);
        // 给刚体设置速度
        bulletRigidBody.setLinearVelocity(direction);
    }

    /**
     * 绘制弹道
     * @param targetPos 目标位置
     * @param angle 初始角度
     * @param velocity 初始速度
     * @param fixedDistance 固定距离
     */
    protected drawTrajectory(targetPos: Vec3, angle: number, velocity: number, fixedDistance: boolean) {
        const firePos = this.firePoint.getWorldPosition();
        if (fixedDistance) {
            const distance = ProjectileMath.calculateDisplacementAtMoment(angle, velocity, 2).x;
            this.trajectoryDrawer.draw(firePos, targetPos, angle, velocity, distance);
        } else {
            this.trajectoryDrawer.draw(firePos, targetPos, angle, velocity);
        }
    }

    /**
     * 生成炮弹
     */
    protected generateBullet() {
        const node = instantiate(this.bulletPrefab);
        director.getScene().addChild(node);
        node.setWorldPosition(this.firePoint.getWorldPosition());
        node.setWorldRotation(this.firePoint.getWorldRotation());
        return node;
    }

    /**
     * 计算位移距离
     * @param targetPos 目标位置
     */
    protected calculateDisplacement(targetPos: Vec3) {
        // 从目标点到发射点的方向矢量
        const firePos = this.firePoint.getWorldPosition(),
            direction = Vec3.subtract(new Vec3, targetPos, firePos);
        // 垂直位移（相当于 targetPos.y - firePos.y）
        const vertical = direction.y;
        // 水平位移（将方向矢量投影到水平面上，其长度就是水平位移的长度）
        const horizontal = VectorUtil.projectOnPlane(direction, Vec3.UP).length();
        return { horizontal, vertical };
    }

    /**
     * 根据角度计算速度
     * @param targetPos 目标位置
     * @param angle 初始角度
     */
    protected calculateVelocity(targetPos: Vec3, angle: number) {
        const { horizontal, vertical } = this.calculateDisplacement(targetPos);
        return ProjectileMath.calculateWithAngle(horizontal, vertical, angle);
    }

    /**
     * 根据速度计算角度
     * @param targetPos 目标位置
     * @param velocity 初始角度
     */
    protected calculateAngle(targetPos: Vec3, velocity: number) {
        const { horizontal, vertical } = this.calculateDisplacement(targetPos);
        return ProjectileMath.calculateWithVelocity(horizontal, vertical, velocity);
    }

    /**
     * 根据最大高度计算速度和角度
     * @param targetPos 目标位置
     */
    protected calculateWithMaxHeight(targetPos: Vec3) {
        const { horizontal, vertical } = this.calculateDisplacement(targetPos);
        const maxHeight = Math.max(0.5, vertical + (horizontal * 0.3));  // 最大高度
        return ProjectileMath.calculateWithMaxHeight(horizontal, vertical, maxHeight);
    }

}
