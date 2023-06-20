/**
 * 父亲类
 */
class Father {
  /**
   * 名称
   * @description 这是名称详情
   */
  name: string;

  /**
   * 年龄
   */
  age: number;

  constructor(name: string) {
    this.name = name;
  } // 这是构建函数

  /**
   * 设置名字
   * @param name
   */
  setName(name: string) {
    this.name = name;
  }
}

export default Father;
