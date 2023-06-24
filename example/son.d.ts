import Father from "./father";

/**
 * 测试儿子
 * @special 你好哇
 * @warning
 */
export class Son extends Father {
  /**
   * 颜色
   */
  color: string;

  constructor(name: string, color: string);
  /**
   * 设置颜色
   * @param color
   */
  setColor(color: string): void;

  /**
   * 获取名字
   * @returns
   */
  getName(): string;

  /**
   * 多态
   * @param name
   * TODO: 这里能自动推断出 returnType 吗？
   */
  setName(name: string): string;
}
