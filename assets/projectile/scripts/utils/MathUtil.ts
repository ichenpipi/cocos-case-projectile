import { game } from 'cc';

/** 用于弧度转角度 */
const rad2Deg = 180 / Math.PI;

/** 用于角度转弧度 */
const deg2Rad = Math.PI / 180;

/**
 * 数学工具
 * @author 陈皮皮 (ifaswind)
 * @version 20220322
 * @requires cocos-creator-3.x
 */
export class MathUtil {

    /**
     * 用于弧度转角度
     */
    public static get rad2Deg() {
        return rad2Deg;
    }

    /**
     * 用于角度转弧度
     */
    public static get deg2Rad() {
        return deg2Rad;
    }

    /**
     * 弧度转角度
     * @param radians 
     */
    public static radiansToDegrees(radians: number) {
        return radians * rad2Deg;
    }

    /**
     * 角度转弧度
     * @param degree 
     */
    public static degreesToRadians(degree: number) {
        return degree * deg2Rad;
    }

    /**
     * 限制值
     * @param value 值
     * @param min 最小值
     * @param max 最大值
     */
    public static clamp(value: number, min: number, max: number) {
        if (value < min) {
            return min;
        } else if (value > max) {
            return max;
        }
        return value;
    }

    /**
     * 限制值
     * @param value 值
     */
    public static clamp01(value: number) {
        return MathUtil.clamp(value, 0, 1);
    }

    /**
     * 线性插值
     * @param from 
     * @param to 
     * @param t 
     */
    public static lerp(from: number, to: number, t: number) {
        return from + (to - from) * MathUtil.clamp01(t);
    }

    /**
     * 0 或 1
     * @param a 
     * @param t 
     */
    public static step(a: number, t: number) {
        return t < a ? 0 : 1;
    }

    /**
     * 在最小值和最大值之间进行插值，并在极限处进行平滑处理
     * @param from 
     * @param to 
     * @param t 
     */
    public static smoothStep(from: number, to: number, t: number) {
        t = MathUtil.clamp01(t);
        t = (-2.0 * t * t * t + 3.0 * t * t);
        return (to * t + from * (1.0 - t));
    }

    /**
     * 平滑控制
     * @param current 当前值
     * @param target 目标值
     * @param currentVelocity 当前速度
     * @param smoothTime 平滑时间
     * @param maxSpeed 最大速度
     * @param deltaTime 时间增量
     */
    public static smoothDamp(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed?: number, deltaTime?: number) {
        maxSpeed = maxSpeed != undefined ? maxSpeed : Number.POSITIVE_INFINITY;
        deltaTime = deltaTime != undefined ? deltaTime : game.deltaTime;
        smoothTime = Math.max(0.0001, smoothTime);
        const num1 = 2 / smoothTime;
        const num2 = num1 * deltaTime;
        const num3 = (1 / (1 + num2 + 0.47999998927116394 * num2 * num2 + 0.23499999940395355 * num2 * num2 * num2));
        const num4 = current - target;
        const num5 = target;
        const max = maxSpeed * smoothTime;
        const num6 = MathUtil.clamp(num4, -max, max);
        target = current - num6;
        const num7 = (currentVelocity + num1 * num6) * deltaTime;
        let velocity = (currentVelocity - num1 * num7) * num3;
        let num8 = target + (num6 + num7) * num3;
        if ((num5 - current > 0) === (num8 > num5)) {
            num8 = num5;
            velocity = (num8 - num5) / deltaTime;
        }
        return {
            value: num8,
            velocity: velocity,
        };
    }

}
