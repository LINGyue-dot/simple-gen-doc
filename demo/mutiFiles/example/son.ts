import Father from "./father";

class Son extends Father {
  /**
   * 颜色
   */
  color: string;

  constructor(name: string, color: string) {
    super(name);
    this.color = color;
  }
  /**
   * 设置颜色
   * @param color
   */
  setColor(color: string) {
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
  setName(name: string) {
    this.name = name;
    return this.name;
  }
}
