import { Vec3 } from "cc";

/** 用于弧度转角度 */
const rad2Deg = 180 / Math.PI;

/** 用于角度转弧度 */
const deg2Rad = Math.PI / 180;

/** 用于计算的临时工 */
const tempVec3 = new Vec3();

/**
 * 矢量工具
 * @author 陈皮皮 (ifaswind)
 * @version 20220331
 * @requires cocos-creator-3.x
 */
export class VectorUtil {

    /**
     * 计算向量在指定平面上的投影
     * @param vector 被投影的向量
     * @param planeNormal 平面法线
     */
    public static projectOnPlane(vector: Vec3, planeNormal: Vec3) {
        // 也可以直接用 Vec3 自带的平面投影函数
        // return Vec3.projectOnPlane(new Vec3, targetDir, planeNormal);

        // 使用点乘计算方向矢量在平面法线上的投影长度
        const projectionLength = Vec3.dot(vector, planeNormal);
        // 平面法线与长度相乘得到方向矢量在平面法线上的投影矢量
        const vectorOnPlane = tempVec3.set(planeNormal).multiplyScalar(projectionLength);
        // 方向矢量减去其在平面法线上的投影矢量即是其在平面上的投影矢量
        return Vec3.subtract(new Vec3, vector, vectorOnPlane);
    }

    /**
     * 计算两个向量基于指定轴的夹角（逆时针方向为正方向，值范围 -180 ~ 180）
     * @param a 向量 a
     * @param b 向量 b
     * @param axis 参照轴向量（请确保是归一化的）
     */
    public static signedAngle(a: Vec3, b: Vec3, axis: Vec3) {
        // 将向量 a 和 b 分别投影到以 axis 为法线的平面上
        const aOnAxisPlane = VectorUtil.projectOnPlane(a, axis);
        const bOnAxisPlane = VectorUtil.projectOnPlane(b, axis);
        // 归一化处理
        const aNormalized = aOnAxisPlane.normalize();
        const bNormalized = bOnAxisPlane.normalize();
        // 求出同时垂直于 a 和 b 的法向量
        const abNormal = Vec3.cross(new Vec3, aNormalized, bNormalized).normalize();
        // 将法向量到 axis 上的投影长度
        // 若投影长度为正值（+1）则表示法向量与 axis 同向（向量叉乘的右手法则）
        const sign = Vec3.dot(abNormal, axis);
        // 求出向量 a 和 b 的夹角
        const radian = Math.acos(Vec3.dot(aNormalized, bNormalized));
        // 混合在一起！
        return radian * sign * rad2Deg;
    }

    // /**
    //  * 计算两个向量基于指定轴的夹角（逆时针方向为正方向，值范围 -180 ~ 180）
    //  * @param a 向量 a
    //  * @param b 向量 b
    //  * @param axis 参照轴向量（请确保是归一化的）
    //  */
    // public static signedAngle(a: Vec3, b: Vec3, axis: Vec3) {
    //     const n = Vec3.cross(new Vec3, a, b);
    //     const r = Math.atan2(Vec3.dot(n, axis), Vec3.dot(a, b));
    //     return -r * rad2Deg;
    // }

}
