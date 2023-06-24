import Father from "./father";

/**
 * 儿子特殊类
 * @special 你好哇
 * @warning
 */
export class Son extends Father {
  /**
   * 颜色
   */
  color;

  constructor(name, color) {
    super(name);
    this.color = color;
  }
  /**
   * 设置颜色
   * @param color
   */
  setColor(color) {
    this.color = color;
  }

  /**
   * 获取名字
   * @returns
   */
  getName() {
    return this.name;
  }

  /**
   * 多态
   * @param name
   * TODO: 这里能自动推断出 returnType 吗？
   */
  setName(name) {
    this.name = name;
    return this.name;
  }
}
