import { PhysicsSystem } from "cc";

/** 用于弧度转角度 */
const rad2Deg = 180 / Math.PI;

/** 用于角度转弧度 */
const deg2Rad = Math.PI / 180;

/**
 * 抛射运动的数学库
 */
export class ProjectileMath {

    /**
     * 重力加速度（垂直向下）
     */
    private static get gravity() {
        return Math.abs(PhysicsSystem.instance.gravity.y);
    }

    /**
     * 计算耗时
     * @param x 水平位移
     * @param angle 初始角度
     * @param velocity 初始速度
     */
    public static calculateTotalTime(x: number, angle: number, velocity: number) {
        // 初始角度（弧度制）
        const θ = angle * deg2Rad;

        // 时间
        // t = x / ( v * cos(θ) )
        const t = x / (velocity * Math.cos(θ));

        return t;
    }

    /**
     * 计算指定时刻的运动角度
     * @param angle 初始角度
     * @param velocity 初始速度
     * @param time 时间
     * @param returnInRadians 是否返回弧度制结果
     */
    public static calculateAngleAtMoment(angle: number, velocity: number, time: number, returnInRadians: boolean = false) {
        // 重力加速度（垂直向下）
        const g = ProjectileMath.gravity;
        // 初始角度（弧度制）
        const θ = angle * deg2Rad;

        // 水平瞬时速度
        // vx = v * cos(θ)
        const vx = velocity * Math.cos(θ);

        // 垂直瞬时速度
        // vy = v * sin(θ) - g * t
        const vy = velocity * Math.sin(θ) - g * time;

        // 该时刻的运动角度（弧度制）
        const θt = Math.atan(vy / vx);

        return (returnInRadians ? θt : θt * rad2Deg);
    }

    /**
     * 计算指定时刻的位移距离
     * @param angle 初始角度
     * @param velocity 初始速度
     * @param time 时间点
     */
    public static calculateDisplacementAtMoment(angle: number, velocity: number, time: number) {
        // 重力加速度（垂直向下）
        const g = ProjectileMath.gravity;
        // 初始角度（弧度制）
        const θ = angle * deg2Rad;

        // 水平位移
        // x = v * cos(θ) * t
        const x = velocity * Math.cos(θ) * time;

        // 垂直位移
        // y = v * sin(θ) * t - 0.5 * g * t^2
        const y = velocity * Math.sin(θ) * time - 0.5 * g * Math.pow(time, 2);

        return { x, y };
    }

    /**
     * 根据初始角度计算初始速度
     * @param x 水平距离
     * @param y 垂直距离
     * @param angle 初始角度（角度制）
     */
    public static calculateWithAngle(x: number, y: number, angle: number) {
        // 重力加速度（垂直向下）
        const g = Math.abs(PhysicsSystem.instance.gravity.y);
        // 初始角度（弧度制）
        const θ = angle * deg2Rad;

        // 速度公式
        // v = sqrt( ( x^2 * g ) / ( 2 * x * sin(θ) * cos(θ) - 2 * y * cos(θ)^2 ) )

        // 部分计算结果
        const p1 = (2 * x * Math.sin(θ) * Math.cos(θ)) - (2 * y * Math.pow(Math.cos(θ), 2));
        // 负数没有平方根
        if (p1 < 0) {
            return NaN;
        }
        // 速度
        const v = Math.sqrt((g * Math.pow(x, 2)) / p1);

        return v;
    }

    /**
     * 根据初始速度计算初始角度
     * @param x 水平距离
     * @param y 垂直距离
     * @param velocity 初始速度
     */
    public static calculateWithVelocity(x: number, y: number, velocity: number) {
        // 重力加速度（垂直向下）
        const g = ProjectileMath.gravity;
        // 初始速度
        const v = velocity;

        // 角度公式
        // θ = atan( ( -v^2 ± sqrt( v^4 - g * ( g * x^2 + 2 * y * v^2 ) ) / ( -g * x ) ) )

        // 部分计算结果
        const p1 = Math.pow(v, 2);
        const p2 = Math.pow(v, 4) - g * (g * Math.pow(x, 2) + 2 * y * p1);
        // 负数没有平方根
        if (p2 < 0) {
            return {
                angle1: NaN,
                angle2: NaN,
            };
        }
        // 部分计算结果
        const p3 = Math.sqrt(p2);
        // 角度（两个解）
        const θ1 = Math.atan((-p1 + p3) / (-g * x));
        const θ2 = Math.atan((-p1 - p3) / (-g * x));

        return {
            angle1: θ1 * rad2Deg,
            angle2: θ2 * rad2Deg,
        };
    }

    /**
     * 根据最大高度计算速度和角度
     * @param x 水平距离
     * @param y 垂直距离
     * @param maxHeight 最大高度
     */
    public static calculateWithMaxHeight(x: number, y: number, maxHeight: number) {
        // 重力加速度（垂直向下）
        const g = ProjectileMath.gravity;
        // 最大高度
        const h = maxHeight;

        // 最大高度不能小于 0，也不能够小于垂直距离
        if (h < 0 || (h - y) < 0) {
            return {
                angle: NaN,
                velocity: NaN,
                time: NaN,
            };
        }

        // 部分计算结果
        const p1 = Math.sqrt(2 * g * h);
        const p2 = Math.sqrt(2 * g * (h - y));

        // 时间公式
        // t = ( -sqrt( 2 * g * h ) ± sqrt( 2 * g * ( h - y ) ) ) / -g
        const t1 = (-p1 + p2) / -g;
        const t2 = (-p1 - p2) / -g;
        // 始终使用较大的解
        const t = Math.max(t1, t2);

        // 角度公式
        // θ = atan( ( sqrt( 2 * g * h ) * t ) / x )
        const θ = Math.atan(p1 * t / x);

        // 速度公式
        // v = sqrt( 2 * g * h ) / sin(θ)
        const v = p1 / Math.sin(θ);

        return {
            angle: θ * rad2Deg,
            velocity: v,
            time: t,
        };
    }

}
