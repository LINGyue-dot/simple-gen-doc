/**
 * 单文件测试
 */
class SingleFile {
  /**
   * 名字
   */
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  /**
   * 测试名字
   * @returns
   */
  sayHello() {
    return this.name;
  }
}
