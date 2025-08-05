# i18n-xy 测试用例场景分类文档

## 1. 基础字符串处理场景

### 1.1 字符串字面量
**场景说明**: 处理基本的字符串字面量，包括单引号、双引号字符串。

**文件类型**: `.js`, `.jsx`, `.ts`, `.tsx`

**场景示例**:
```javascript
// 简单字符串
const message = '你好，世界';
const title = "欢迎使用";

// 包含特殊字符
const error = '错误：请检查输入！';
const warning = "警告: 数据未保存...";

// 包含变量的字符串拼接
const username = 'Alice';
const greeting = '你好，' + username + '，欢迎回来！';
```

**期望转换**:
```javascript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

const message = $t1('ni_hao_shi_jie');
const title = $t1('huan_ying_shi_yong');

const error = $t1('cuo_wu_qing_jian_cha_shu_ru');
const warning = $t1('jing_gao_shu_ju_wei_bao_cun');

const username = 'Alice';
const greeting = $t1('ni_hao_huan_ying_hui_lai', { username });
```

### 1.2 模板字符串
**场景说明**: 处理模板字符串，包括多行文本、变量插值等。

**文件类型**: `.js`, `.jsx`, `.ts`, `.tsx`

**场景示例**:
```javascript
// 基础模板字符串
const name = 'World';
const greeting = `你好，${name}`;

// 多行模板字符串
const html = `
  <div>
    <h1>欢迎访问</h1>
    <p>这是一段介绍文字</p>
  </div>
`;

// 复杂插值
const status = 'success';
const count = 5;
const message = `操作${status === 'success' ? '成功' : '失败'}，共处理 ${count} 条数据`;
```

**期望转换**:
```javascript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

const name = 'World';
const greeting = $t1('ni_hao', { name });

const html = $t1('html_template', {
  title: $t1('huan_ying_fang_wen'),
  content: $t1('zhe_shi_yi_duan_jie_shao_wen_zi')
});

const status = 'success';
const count = 5;
const message = $t1('cao_zuo_xin_xi', {
  status: status === 'success' ? $t1('cheng_gong') : $t1('shi_bai'),
  count
});
```

**特别说明**: 
- 对于复杂的模板字符串，需要考虑是否应该拆分成多个翻译键
- HTML模板应该保持结构，只转换文本内容

### 1.3 注释中的中文
**场景说明**: 处理代码中的中文注释。

**文件类型**: 所有文件类型

**场景示例**:
```javascript
// 这是一个函数注释
function process() {
  // 处理数据
  const data = getData();
  
  /* 多行注释
   * 这里是详细说明
   * 包含多行内容
   */
  
  /**
   * @param {string} name 用户名
   * @returns {string} 格式化后的用户名
   */
}
```

**特别说明**: 
- 注释中的中文通常不需要转换
- 但如果配置指定要转换注释，则需要特殊处理

## 2. React/JSX 场景

### 2.1 JSX文本节点
**场景说明**: 处理JSX组件中的文本节点。

**文件类型**: `.jsx`, `.tsx`

**场景示例**:
```jsx
// 基础文本节点
function Welcome() {
  return <h1>欢迎使用</h1>;
}

// 混合内容
function Header() {
  return (
    <div>
      <h1>我的应用</h1>
      <p>这是一个<strong>重要</strong>的说明</p>
    </div>
  );
}

// 条件渲染
function Status({ isOnline }) {
  return (
    <div>
      {isOnline ? '在线' : '离线'}
      {isOnline && <span>（正在工作）</span>}
    </div>
  );
}
```

**期望转换**:
```jsx
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

function Welcome() {
  return <h1>{$t1('huan_ying_shi_yong')}</h1>;
}

function Header() {
  return (
    <div>
      <h1>{$t1('wo_de_ying_yong')}</h1>
      <p>{$t1('zhong_yao_shuo_ming', {
        emphasis: (text) => <strong>{text}</strong>
      })}</p>
    </div>
  );
}

function Status({ isOnline }) {
  return (
    <div>
      {isOnline ? $t1('zai_xian') : $t1('li_xian')}
      {isOnline && <span>{$t1('zheng_zai_gong_zuo')}</span>}
    </div>
  );
}
```

### 2.2 JSX属性
**场景说明**: 处理JSX组件中的属性值，一般class， style等属性不需要转换，但是如果配置了需要转换也是可以的。

**文件类型**: `.jsx`, `.tsx`

**场景示例**:
```jsx
// 基础属性
<input
  placeholder="请输入用户名"
  title="用户名输入框"
  aria-label="用户名"
/>

// 动态属性
<button
  className={`btn ${isActive ? 'active' : 'inactive'}`}
  aria-label={`编辑 ${user.name}`}
  title={`点击编辑${user.role}用户信息`}
>
  编辑
</button>

// 复杂属性对象
const buttonProps = {
  disabled: user.status === '离线',
  'aria-label': `编辑 ${user.name}`,
  'data-user-role': user.role,
  className: `btn ${isActive ? 'active' : 'inactive'}`
};
```

**期望转换**:
```jsx
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// 基础属性
<input
  placeholder={$t1('qing_shu_ru_yong_hu_ming')}
  title={$t1('yong_hu_ming_shu_ru_kuang')}
  aria-label={$t1('yong_hu_ming')}
/>

// 动态属性
<button
  className={`btn ${isActive ? 'active' : 'inactive'}`}
  aria-label={$t1('bian_ji_yong_hu', { name: user.name })}
  title={$t1('dian_ji_bian_ji_yong_hu_xin_xi', { role: user.role })}
>
  {$t1('bian_ji')}
</button>

// 复杂属性对象
const buttonProps = {
  disabled: user.status === $t1('li_xian'),
  'aria-label': $t1('bian_ji_yong_hu', { name: user.name }),
  'data-user-role': $t1(user.role),
  className: `btn ${isActive ? 'active' : 'inactive'}`
};
```

### 2.3 动态渲染列表
**场景说明**: 处理在循环或映射中的JSX内容。

**文件类型**: `.jsx`, `.tsx`

**场景示例**:
```jsx
// 基础列表渲染
const items = ['待办', '进行中', '已完成'];
function TodoList() {
  return (
    <ul>
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// 复杂对象列表
const notifications = [
  { id: 1, type: '成功', message: '操作成功完成' },
  { id: 2, type: '错误', message: '操作失败，请重试' },
  { id: 3, type: '警告', message: '请注意数据变化' }
];

function NotificationList() {
  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id} className={`notification ${notification.type}`}>
          <span className="type">
            {notification.type === '成功' && '✓ 成功'}
            {notification.type === '错误' && '✗ 错误'}
            {notification.type === '警告' && '⚠ 警告'}
          </span>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
}

// 嵌套循环渲染
const sections = [
  {
    title: '今日任务',
    items: ['编写文档', '代码审查', '团队会议']
  },
  {
    title: '待办事项',
    items: ['系统升级', '性能优化', '用户反馈']
  }
];

function TaskList() {
  return (
    <div>
      {sections.map(section => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

**期望转换**:
```jsx
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// 基础列表渲染
const items = [$t1('dai_ban'), $t1('jin_xing_zhong'), $t1('yi_wan_cheng')];
function TodoList() {
  return (
    <ul>
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// 复杂对象列表
const notifications = [
  { id: 1, type: $t1('cheng_gong'), message: $t1('cao_zuo_cheng_gong_wan_cheng') },
  { id: 2, type: $t1('cuo_wu'), message: $t1('cao_zuo_shi_bai_qing_chong_shi') },
  { id: 3, type: $t1('jing_gao'), message: $t1('qing_zhu_yi_shu_ju_bian_hua') }
];

function NotificationList() {
  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id} className={`notification ${notification.type}`}>
          <span className="type">
            {notification.type === $t1('cheng_gong') && $t1('success_with_icon')}
            {notification.type === $t1('cuo_wu') && $t1('error_with_icon')}
            {notification.type === $t1('jing_gao') && $t1('warning_with_icon')}
          </span>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
}

// 嵌套循环渲染
const sections = [
  {
    title: $t1('jin_ri_ren_wu'),
    items: [$t1('bian_xie_wen_dang'), $t1('dai_ma_shen_cha'), $t1('tuan_dui_hui_yi')]
  },
  {
    title: $t1('dai_ban_shi_xiang'),
    items: [$t1('xi_tong_sheng_ji'), $t1('xing_neng_you_hua'), $t1('yong_hu_fan_kui')]
  }
];

function TaskList() {
  return (
    <div>
      {sections.map(section => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

**特别说明**:
- 对于列表渲染，需要注意 key 的处理
- 当使用中文作为 key 时，需要确保转换后的 key 仍然唯一
- 对于条件渲染中的类型判断，建议使用常量或枚举

## 3. TypeScript 特有场景

### 3.1 类型定义中的字符串字面量
**场景说明**: 处理 TypeScript 类型定义中的中文字符串字面量。

**文件类型**: `.ts`, `.tsx`

**场景示例**:
```typescript
// 字符串字面量类型
type Status = '在线' | '离线' | '忙碌';
type NotificationType = '成功' | '警告' | '错误' | '信息';

// 接口定义
interface UserConfig {
  role: '管理员' | '普通用户' | '访客';
  status: Status;
  settings: {
    theme: '浅色' | '深色' | '自动';
    language: '中文' | '英文';
  };
}

// 枚举定义
enum UserRole {
  Admin = '管理员',
  User = '普通用户',
  Guest = '访客'
}

// 泛型约束
interface ValidationResult<T extends '成功' | '失败'> {
  status: T;
  message: string;
}
```

**特别说明**:
- 类型定义中的字符串字面量是否需要转换需要进一步讨论
- 建议参考 `docs/discuss.md` 中的相关讨论

### 3.2 装饰器中的中文
**场景说明**: 处理 TypeScript 装饰器中的中文字符串。

**文件类型**: `.ts`, `.tsx`

**场景示例**:
```typescript
// 类装饰器
@Logger({
  prefix: '用户服务',
  level: '信息'
})
class UserService {
  @Validate('用户名不能为空')
  setUsername(name: string) {}

  @ErrorHandler('保存失败')
  save() {}
}

// 属性装饰器
class Form {
  @MinLength(5, '长度不足')
  username: string;

  @Required('此字段必填')
  password: string;
}

// 方法参数装饰器
class API {
  fetch(@Param('查询参数') query: string) {}
}
```

**期望转换**:
```typescript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

@Logger({
  prefix: $t1('yong_hu_fu_wu'),
  level: $t1('xin_xi')
})
class UserService {
  @Validate($t1('yong_hu_ming_bu_neng_wei_kong'))
  setUsername(name: string) {}

  @ErrorHandler($t1('bao_cun_shi_bai'))
  save() {}
}

class Form {
  @MinLength(5, $t1('chang_du_bu_zu'))
  username: string;

  @Required($t1('ci_zi_duan_bi_tian'))
  password: string;
}

class API {
  fetch(@Param($t1('cha_xun_can_shu')) query: string) {}
}
```

## 4. 复杂场景处理

### 4.1 条件判断和三元表达式
**场景说明**: 处理条件判断和三元表达式中的中文字符串。

**文件类型**: 所有文件类型

**场景示例**:
```javascript
// 基础三元表达式
const userType = isVip ? '尊贵会员' : '普通用户';
const status = age > 18 ? '成年人' : '未成年人';

// 嵌套三元表达式
const memberType = isVip 
  ? (age > 30 ? '资深会员' : '新会员') 
  : '访客';

// if 条件判断
if (userType === '尊贵会员') {
  console.log('欢迎VIP用户');
}

// switch 语句
switch (userType) {
  case '尊贵会员':
    console.log('VIP服务');
    break;
  case '普通用户':
    console.log('标准服务');
    break;
  default:
    console.log('默认服务');
}
```

**期望转换**:
```javascript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// 基础三元表达式
const userType = isVip ? $t1('zun_gui_hui_yuan') : $t1('pu_tong_yong_hu');
const status = age > 18 ? $t1('cheng_nian_ren') : $t1('wei_cheng_nian_ren');

// 嵌套三元表达式
const memberType = isVip 
  ? (age > 30 ? $t1('zi_shen_hui_yuan') : $t1('xin_hui_yuan')) 
  : $t1('fang_ke');

// if 条件判断
if (userType === $t1('zun_gui_hui_yuan')) {
  console.log($t1('huan_ying_vip_yong_hu'));
}

// switch 语句
switch (userType) {
  case $t1('zun_gui_hui_yuan'):
    console.log($t1('vip_fu_wu'));
    break;
  case $t1('pu_tong_yong_hu'):
    console.log($t1('biao_zhun_fu_wu'));
    break;
  default:
    console.log($t1('mo_ren_fu_wu'));
}
```

### 4.2 函数参数和默认值
**场景说明**: 处理函数参数、默认值和返回值中的中文字符串。

**文件类型**: 所有文件类型

**场景示例**:
```javascript
// 基础函数参数
function greet(name = '默认用户', message = '你好') {
  return `${message}，${name}！`;
}

// 箭头函数
const sayHello = (greeting = '欢迎') => 
  `${greeting}访问我们的网站`;

// 复杂函数参数
function showUserInfo({
  name = '匿名用户',
  role = '访客',
  greeting = '欢迎回来'
} = {}) {
  return `${greeting}，${role}${name}`;
}

// 回调函数
function processData(data, onSuccess = () => '处理成功', onError = () => '处理失败') {
  try {
    // 处理数据
    return onSuccess();
  } catch {
    return onError();
  }
}
```

**期望转换**:
```javascript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// 基础函数参数
function greet(name = $t1('mo_ren_yong_hu'), message = $t1('ni_hao')) {
  return $t1('greeting_template', { message, name });
}

// 箭头函数
const sayHello = (greeting = $t1('huan_ying')) => 
  $t1('visit_website_template', { greeting });

// 复杂函数参数
function showUserInfo({
  name = $t1('ni_ming_yong_hu'),
  role = $t1('fang_ke'),
  greeting = $t1('huan_ying_hui_lai')
} = {}) {
  return $t1('user_info_template', { greeting, role, name });
}

// 回调函数
function processData(
  data, 
  onSuccess = () => $t1('chu_li_cheng_gong'), 
  onError = () => $t1('chu_li_shi_bai')
) {
  try {
    // 处理数据
    return onSuccess();
  } catch {
    return onError();
  }
}
```

### 4.3 复杂对象和数组
**场景说明**: 处理复杂对象和数组中的中文字符串。

**文件类型**: 所有文件类型

**场景示例**:
```javascript
// 复杂对象
const userInfo = {
  name: '用户姓名',
  role: '管理员',
  permissions: ['查看', '编辑', '删除'],
  settings: {
    language: '中文',
    theme: '深色主题',
    notifications: {
      email: '每周提醒',
      sms: '重要消息'
    }
  }
};

// 数组对象
const menuItems = [
  { id: 1, title: '首页', path: '/' },
  { id: 2, title: '产品中心', path: '/products' },
  { id: 3, title: '关于我们', path: '/about' }
];

// 嵌套数组
const tableData = [
  ['姓名', '年龄', '职位'],
  ['张三', '25', '工程师'],
  ['李四', '30', '设计师'],
  ['王五', '35', '经理']
];

// 混合数据结构
const appConfig = {
  title: '我的应用',
  menu: ['文件', '编辑', '视图', '帮助'],
  dialogs: {
    confirm: {
      title: '确认操作',
      buttons: ['确定', '取消']
    },
    error: {
      title: '错误提示',
      buttons: ['重试', '关闭']
    }
  }
};
```

**期望转换**:
```javascript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// 复杂对象
const userInfo = {
  name: $t1('yong_hu_xing_ming'),
  role: $t1('guan_li_yuan'),
  permissions: [
    $t1('cha_kan'), 
    $t1('bian_ji'), 
    $t1('shan_chu')
  ],
  settings: {
    language: $t1('zhong_wen'),
    theme: $t1('shen_se_zhu_ti'),
    notifications: {
      email: $t1('mei_zhou_ti_xing'),
      sms: $t1('zhong_yao_xiao_xi')
    }
  }
};

// 数组对象
const menuItems = [
  { id: 1, title: $t1('shou_ye'), path: '/' },
  { id: 2, title: $t1('chan_pin_zhong_xin'), path: '/products' },
  { id: 3, title: $t1('guan_yu_wo_men'), path: '/about' }
];

// 嵌套数组
const tableData = [
  [$t1('xing_ming'), $t1('nian_ling'), $t1('zhi_wei')],
  [$t1('zhang_san'), '25', $t1('gong_cheng_shi')],
  [$t1('li_si'), '30', $t1('she_ji_shi')],
  [$t1('wang_wu'), '35', $t1('jing_li')]
];

// 混合数据结构
const appConfig = {
  title: $t1('wo_de_ying_yong'),
  menu: [
    $t1('wen_jian'), 
    $t1('bian_ji'), 
    $t1('shi_tu'), 
    $t1('bang_zhu')
  ],
  dialogs: {
    confirm: {
      title: $t1('que_ren_cao_zuo'),
      buttons: [$t1('que_ding'), $t1('qu_xiao')]
    },
    error: {
      title: $t1('cuo_wu_ti_shi'),
      buttons: [$t1('chong_shi'), $t1('guan_bi')]
    }
  }
};
```

**特别说明**:
- 对于复杂对象，需要递归处理所有层级的中文字符串
- 对于数组中的中文，需要考虑是否保留原始值作为 key
- 配置对象建议使用常量或枚举来管理键名

### 4.4 错误处理场景
**场景说明**: 处理错误信息和异常处理中的中文字符串。

**文件类型**: 所有文件类型

**场景示例**:
```javascript
// 简单字符串错误
function simpleErrorTest() {
  throw '系统异常';
}

// Error构造函数
function constructorErrorTest() {
  throw new Error('操作失败');
}

// 模板字符串错误
function templateErrorTest(api, code) {
  throw new Error(`请求接口${api}失败: ${code}`);
}

// 复杂错误处理
function complexErrorTest(type, id) {
  if (!type) {
    throw new Error(`参数类型不能为空`);
  }
  if (!id) {
    throw new Error(`${type}ID不能为空`);
  }
  throw new Error(`无法处理${type}，ID: ${id}，请联系管理员`);
}

// 条件错误消息
function conditionalErrorTest(success, data) {
  if (!success) {
    throw new Error(
      data ? `处理${data.type}时发生错误` : '未知错误'
    );
  }
}

// 自定义错误类
class ApiError extends Error {
  constructor(message) {
    super(message || '接口调用异常');
    this.name = 'ApiError';
  }
}

function apiErrorTest() {
  throw new ApiError('用户认证失败');
}

// try-catch 错误处理
try {
  await fetchData();
} catch (error) {
  console.error('数据加载失败：', error.message);
  throw new Error('请稍后重试');
}
```

**期望转换**:
```javascript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// 简单字符串错误
function simpleErrorTest() {
  throw $t1('xi_tong_yi_chang');
}

// Error构造函数
function constructorErrorTest() {
  throw new Error($t1('cao_zuo_shi_bai'));
}

// 模板字符串错误
function templateErrorTest(api, code) {
  throw new Error($t1('qing_qiu_jie_kou_shi_bai', { api, code }));
}

// 复杂错误处理
function complexErrorTest(type, id) {
  if (!type) {
    throw new Error($t1('can_shu_lei_xing_bu_neng_wei_kong'));
  }
  if (!id) {
    throw new Error($t1('id_bu_neng_wei_kong', { type }));
  }
  throw new Error($t1('wu_fa_chu_li_lian_xi_guan_li_yuan', { 
    type, 
    id 
  }));
}

// 条件错误消息
function conditionalErrorTest(success, data) {
  if (!success) {
    throw new Error(
      data 
        ? $t1('chu_li_shi_fa_sheng_cuo_wu', { type: data.type })
        : $t1('wei_zhi_cuo_wu')
    );
  }
}

// 自定义错误类
class ApiError extends Error {
  constructor(message) {
    super(message || $t1('jie_kou_diao_yong_yi_chang'));
    this.name = 'ApiError';
  }
}

function apiErrorTest() {
  throw new ApiError($t1('yong_hu_ren_zheng_shi_bai'));
}

// try-catch 错误处理
try {
  await fetchData();
} catch (error) {
  console.error($t1('shu_ju_jia_zai_shi_bai'), error.message);
  throw new Error($t1('qing_shao_hou_chong_shi'));
}
```

**特别说明**:
- 错误消息通常需要保持简洁明了
- 对于包含动态内容的错误消息，需要使用模板
- 考虑是否需要为不同类型的错误使用不同的翻译键
- 错误消息的翻译键建议使用特定前缀，如 `error_`

### 4.5 异步和Promise场景
**场景说明**: 处理异步函数和Promise中的中文字符串。

**文件类型**: 所有文件类型

**场景示例**:
```javascript
// 基础异步函数
async function fetchUserData() {
  try {
    const response = await fetch('/api/user');
    return { success: true, message: '数据加载成功' };
  } catch (error) {
    return { success: false, message: '数据加载失败' };
  }
}

// Promise链
const loadData = () => {
  return Promise.resolve('开始加载')
    .then(() => {
      if (Math.random() > 0.5) {
        return '加载成功';
      }
      throw new Error('加载失败');
    })
    .catch(error => `处理异常: ${error.message}`)
    .finally(() => console.log('加载完成'));
};

// 异步操作状态
async function processTask() {
  const status = {
    pending: '处理中...',
    success: '处理完成',
    error: '处理失败'
  };

  try {
    console.log(status.pending);
    await someAsyncTask();
    return status.success;
  } catch {
    return status.error;
  }
}

// 复杂异步流程
async function complexAsyncFlow() {
  const steps = [
    '初始化系统',
    '加载配置',
    '连接数据库',
    '启动服务'
  ];

  for (const step of steps) {
    try {
      console.log(`正在${step}...`);
      await simulateStep();
      console.log(`${step}完成`);
    } catch (error) {
      throw new Error(`${step}失败: ${error.message}`);
    }
  }

  return '所有步骤执行完成';
}
```

**期望转换**:
```javascript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// 基础异步函数
async function fetchUserData() {
  try {
    const response = await fetch('/api/user');
    return { 
      success: true, 
      message: $t1('shu_ju_jia_zai_cheng_gong') 
    };
  } catch (error) {
    return { 
      success: false, 
      message: $t1('shu_ju_jia_zai_shi_bai') 
    };
  }
}

// Promise链
const loadData = () => {
  return Promise.resolve($t1('kai_shi_jia_zai'))
    .then(() => {
      if (Math.random() > 0.5) {
        return $t1('jia_zai_cheng_gong');
      }
      throw new Error($t1('jia_zai_shi_bai'));
    })
    .catch(error => $t1('chu_li_yi_chang', { 
      message: error.message 
    }))
    .finally(() => console.log($t1('jia_zai_wan_cheng')));
};

// 异步操作状态
async function processTask() {
  const status = {
    pending: $t1('chu_li_zhong'),
    success: $t1('chu_li_wan_cheng'),
    error: $t1('chu_li_shi_bai')
  };

  try {
    console.log(status.pending);
    await someAsyncTask();
    return status.success;
  } catch {
    return status.error;
  }
}

// 复杂异步流程
async function complexAsyncFlow() {
  const steps = [
    $t1('chu_shi_hua_xi_tong'),
    $t1('jia_zai_pei_zhi'),
    $t1('lian_jie_shu_ju_ku'),
    $t1('qi_dong_fu_wu')
  ];

  for (const step of steps) {
    try {
      console.log($t1('zheng_zai_process', { step }));
      await simulateStep();
      console.log($t1('step_complete', { step }));
    } catch (error) {
      throw new Error($t1('step_failed', { 
        step, 
        error: error.message 
      }));
    }
  }

  return $t1('suo_you_bu_zhou_zhi_xing_wan_cheng');
}
```

**特别说明**:
- 异步操作的状态文本建议使用常量管理
- Promise链中的错误消息需要考虑国际化
- 对于复杂的异步流程，建议将步骤名称也纳入国际化范围
- 注意保持异步操作的错误消息一致性

### 4.6 常量定义场景
**场景说明**: 处理各种常量定义中的中文字符串。

**文件类型**: `.js`, `.ts`

**场景示例**:
```typescript
// 简单选项数组
const PRIORITY_OPTIONS = [
  { value: '1', text: '普通' },
  { value: '2', text: '紧急' }
];

// 映射对象
const STATUS_MAP = {
  RUNNING: '进行中',
  COMPLETE: '正常结束',
  ABEND: '异常终止'
};

// 带颜色的状态定义
const STATUS_LIST = [
  { value: '0', text: '进行中', color: '#22C265' },
  { value: '1', text: '正常结束', color: '#AEAEAE' },
  { value: '2', text: '异常终止', color: '#E75151' }
];

// 复杂映射关系
const NODES_TEXT_MAP = {
  PERFECT_SCHEME: '完善方案',
  ASP_AUTHORIZATION: '预评估',
  ORIGINAL_FACTORY_AUTHORIZATION: '原厂管理授权',
  CUSTOMER_AUTHORIZATION: '客户授权',
  DEPLOYMENT_IMPLEMENTATION: '部署实施',
  CUSTOMER_ACCEPTANCE: '客户验收',
  FAILURE_FOLLOW_UP: '失败跟进'
};

// 操作文本映射
const OPERATIONS_TEXT = {
  AGREE: {
    PERFECT_SCHEME: '提交',
    ASP_AUTHORIZATION: '通过',
    DEPLOYMENT_IMPLEMENTATION: '部署成功',
    CUSTOMER_ACCEPTANCE: '验收成功'
  },
  REFUSE: {
    PERFECT_SCHEME: '拒绝',
    ASP_AUTHORIZATION: '拒绝',
    DEPLOYMENT_IMPLEMENTATION: '部署失败',
    CUSTOMER_ACCEPTANCE: '验收失败'
  }
};

// 提示文本映射
const TEXTAREA_HINTS = {
  1: '提交后流程将中止；若无与实际情况匹配的原因分类，可联系管理员',
  5: '过程异常时需说明情况，提交后单据将流转至验收节点',
  8: '实施人操作失误且未对客户环境造成影响时可操作'
};

// 枚举定义
enum ChangeChannel {
  page = 1,  // 页面
  group = 2, // 分组
  api = 3,   // 接口
  tianxu = 4 // 天序
}

// 复杂配置对象
const CONFIG = {
  deployment: {
    types: [
      { value: 'ASP', text: 'ASP部署' },
      { value: 'CUSTOMER', text: '客户部署' },
      { value: 'JIAOCHA', text: '交叉部署' }
    ],
    status: {
      success: '部署成功',
      failed: '部署失败',
      pending: '部署中'
    },
    messages: {
      confirm: '确认开始部署吗？',
      success: '部署成功完成',
      error: '部署过程中出现错误'
    }
  }
};
```

**期望转换**:
```typescript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// 简单选项数组
const PRIORITY_OPTIONS = [
  { value: '1', text: $t1('pu_tong') },
  { value: '2', text: $t1('jin_ji') }
];

// 映射对象
const STATUS_MAP = {
  RUNNING: $t1('jin_xing_zhong'),
  COMPLETE: $t1('zheng_chang_jie_shu'),
  ABEND: $t1('yi_chang_zhong_zhi')
};

// 带颜色的状态定义
const STATUS_LIST = [
  { value: '0', text: $t1('jin_xing_zhong'), color: '#22C265' },
  { value: '1', text: $t1('zheng_chang_jie_shu'), color: '#AEAEAE' },
  { value: '2', text: $t1('yi_chang_zhong_zhi'), color: '#E75151' }
];

// 复杂映射关系
const NODES_TEXT_MAP = {
  PERFECT_SCHEME: $t1('wan_shan_fang_an'),
  ASP_AUTHORIZATION: $t1('yu_ping_gu'),
  ORIGINAL_FACTORY_AUTHORIZATION: $t1('yuan_chang_guan_li_shou_quan'),
  CUSTOMER_AUTHORIZATION: $t1('ke_hu_shou_quan'),
  DEPLOYMENT_IMPLEMENTATION: $t1('bu_shu_shi_shi'),
  CUSTOMER_ACCEPTANCE: $t1('ke_hu_yan_shou'),
  FAILURE_FOLLOW_UP: $t1('shi_bai_gen_jin')
};

// 操作文本映射
const OPERATIONS_TEXT = {
  AGREE: {
    PERFECT_SCHEME: $t1('ti_jiao'),
    ASP_AUTHORIZATION: $t1('tong_guo'),
    DEPLOYMENT_IMPLEMENTATION: $t1('bu_shu_cheng_gong'),
    CUSTOMER_ACCEPTANCE: $t1('yan_shou_cheng_gong')
  },
  REFUSE: {
    PERFECT_SCHEME: $t1('ju_jue'),
    ASP_AUTHORIZATION: $t1('ju_jue'),
    DEPLOYMENT_IMPLEMENTATION: $t1('bu_shu_shi_bai'),
    CUSTOMER_ACCEPTANCE: $t1('yan_shou_shi_bai')
  }
};

// 提示文本映射
const TEXTAREA_HINTS = {
  1: $t1('ti_jiao_hou_liu_cheng_jiang_zhong_zhi'),
  5: $t1('guo_cheng_yi_chang_ti_shi'),
  8: $t1('shi_shi_ren_cao_zuo_shi_wu_ti_shi')
};

// 枚举定义
enum ChangeChannel {
  page = 1,  // 页面
  group = 2, // 分组
  api = 3,   // 接口
  tianxu = 4 // 天序
}

// 复杂配置对象
const CONFIG = {
  deployment: {
    types: [
      { value: 'ASP', text: $t1('asp_bu_shu') },
      { value: 'CUSTOMER', text: $t1('ke_hu_bu_shu') },
      { value: 'JIAOCHA', text: $t1('jiao_cha_bu_shu') }
    ],
    status: {
      success: $t1('bu_shu_cheng_gong'),
      failed: $t1('bu_shu_shi_bai'),
      pending: $t1('bu_shu_zhong')
    },
    messages: {
      confirm: $t1('que_ren_kai_shi_bu_shu'),
      success: $t1('bu_shu_cheng_gong_wan_cheng'),
      error: $t1('bu_shu_guo_cheng_zhong_chu_xian_cuo_wu')
    }
  }
};
```

### 4.7 React Hooks 场景
**场景说明**: 处理 React Hooks 组件中的中文字符串。

**文件类型**: `.jsx`, `.tsx`

**场景示例**:
```typescript
// Context 和 Provider
type ThemeMode = '浅色模式' | '深色模式' | '系统默认';
interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider 组件
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('系统默认');

  useEffect(() => {
    const checkSystemTheme = () => {
      if (theme === '系统默认') {
        console.log('检测系统主题设置...');
      }
    };
    checkSystemTheme();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义 Hook
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme必须在ThemeProvider内部使用');
  }
  return context;
};

// Reducer 和 Action
interface User {
  id: number;
  name: string;
  role: '管理员' | '编辑者' | '访客';
  lastLogin: Date;
}

type UserAction =
  | { type: '登录'; payload: User }
  | { type: '登出' }
  | { type: '更新角色'; payload: User['role'] };

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case '登录':
      return {
        ...state,
        user: action.payload,
        error: null
      };
    case '登出':
      return {
        ...state,
        user: null,
        error: null
      };
    case '更新角色':
      return state.user
        ? {
          ...state,
          user: { ...state.user, role: action.payload }
        }
        : state;
    default:
      return state;
  }
}

// 组件中的状态和回调
const NotificationList: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const [filter, setFilter] = useState<'全部' | '未读' | '已读'>('全部');

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case '未读':
        return notifications.filter(n => !n.read);
      case '已读':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  return (
    <div>
      <div>
        <button onClick={() => setFilter('全部')}>全部通知</button>
        <button onClick={() => setFilter('未读')}>未读通知</button>
        <button onClick={() => setFilter('已读')}>已读通知</button>
      </div>
      {filteredNotifications.length === 0 ? (
        <p>没有{filter === '全部' ? '' : filter}通知</p>
      ) : (
        filteredNotifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => {}}
          />
        ))
      )}
    </div>
  );
};

// 错误处理和表单验证
const RegistrationForm: React.FC = () => {
  const [errors, setErrors] = useState<FormErrors>({});
  
  const validateForm = useCallback((values: FormState) => {
    const newErrors: FormErrors = {};
    
    if (!values.username) {
      newErrors.username = '用户名不能为空';
    }
    
    if (!values.email) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    
    if (!values.password) {
      newErrors.password = '密码不能为空';
    } else if (values.password.length < 6) {
      newErrors.password = '密码长度不能小于6位';
    }
    
    if (!values.agreeTerms) {
      newErrors.agreeTerms = '请同意服务条款';
    }
    
    return newErrors;
  }, []);

  return (
    <form>
      {/* 表单内容 */}
    </form>
  );
};
```

**期望转换**:
```typescript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// Context 和 Provider
type ThemeMode = 'light' | 'dark' | 'system';
interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider 组件
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('system');

  useEffect(() => {
    const checkSystemTheme = () => {
      if (theme === 'system') {
        console.log($t1('jian_ce_xi_tong_zhu_ti_she_zhi'));
      }
    };
    checkSystemTheme();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义 Hook
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error($t1('use_theme_provider_error'));
  }
  return context;
};

// Reducer 和 Action
interface User {
  id: number;
  name: string;
  role: 'admin' | 'editor' | 'visitor';
  lastLogin: Date;
}

type UserAction =
  | { type: 'login'; payload: User }
  | { type: 'logout' }
  | { type: 'update_role'; payload: User['role'] };

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'login':
      return {
        ...state,
        user: action.payload,
        error: null
      };
    case 'logout':
      return {
        ...state,
        user: null,
        error: null
      };
    case 'update_role':
      return state.user
        ? {
          ...state,
          user: { ...state.user, role: action.payload }
        }
        : state;
    default:
      return state;
  }
}

// 组件中的状态和回调
const NotificationList: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')}>
          {$t1('quan_bu_tong_zhi')}
        </button>
        <button onClick={() => setFilter('unread')}>
          {$t1('wei_du_tong_zhi')}
        </button>
        <button onClick={() => setFilter('read')}>
          {$t1('yi_du_tong_zhi')}
        </button>
      </div>
      {filteredNotifications.length === 0 ? (
        <p>
          {$t1('mei_you_tong_zhi', {
            filter: filter === 'all' ? '' : $t1(filter)
          })}
        </p>
      ) : (
        filteredNotifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => {}}
          />
        ))
      )}
    </div>
  );
};

// 错误处理和表单验证
const RegistrationForm: React.FC = () => {
  const [errors, setErrors] = useState<FormErrors>({});
  
  const validateForm = useCallback((values: FormState) => {
    const newErrors: FormErrors = {};
    
    if (!values.username) {
      newErrors.username = $t1('yong_hu_ming_bu_neng_wei_kong');
    }
    
    if (!values.email) {
      newErrors.email = $t1('you_xiang_bu_neng_wei_kong');
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      newErrors.email = $t1('you_xiang_ge_shi_bu_zheng_que');
    }
    
    if (!values.password) {
      newErrors.password = $t1('mi_ma_bu_neng_wei_kong');
    } else if (values.password.length < 6) {
      newErrors.password = $t1('mi_ma_chang_du_bu_neng_xiao_yu_6_wei');
    }
    
    if (!values.agreeTerms) {
      newErrors.agreeTerms = $t1('qing_tong_yi_fu_wu_tiao_kuan');
    }
    
    return newErrors;
  }, []);

  return (
    <form>
      {/* 表单内容 */}
    </form>
  );
};
```

**特别说明**:
1. 类型定义处理：
   - 枚举值和类型定义使用英文
   - 状态和角色等固定值使用英文
   - 错误消息和提示文本需要国际化

2. Context 和 Provider：
   - Context 名称和错误消息需要国际化
   - Provider 中的状态值使用英文
   - 日志消息需要国际化

3. Reducer 和 Action：
   - Action type 使用英文
   - 状态和错误消息需要国际化
   - 枚举值使用英文

4. 组件状态和回调：
   - 状态值使用英文
   - UI 文本需要国际化
   - 动态文本使用模板

5. 错误处理：
   - 所有错误消息需要国际化
   - 验证消息使用统一的翻译键
   - 考虑错误消息的复用

### 4.8 动态 JSX 场景
**场景说明**: 处理动态 JSX 中的中文字符串，包括动态属性、条件渲染和列表渲染等场景。

**文件类型**: `.jsx`, `.tsx`

**场景示例**:
```typescript
// 类型定义
interface User {
  id: number;
  name: string;
  role: '管理员' | '编辑者' | '查看者' | '访客';
  status: '在线' | '离线' | '离开' | '忙碌';
  lastActive: Date;
}

type NotificationType = '成功' | '错误' | '警告' | '信息';
type ThemeType = '浅色' | '深色' | '自动';

// 动态属性组件
const DynamicAttributes: React.FC<{ user: User; theme: ThemeType }> = ({ user, theme }) => {
  const [isActive, setIsActive] = useState(user.status === '在线');

  // 动态计算的类名
  const userStatusClass = useMemo(() => {
    switch (user.status) {
      case '在线': return 'status-online';
      case '离线': return 'status-offline';
      case '离开': return 'status-away';
      case '忙碌': return 'status-busy';
      default: return '';
    }
  }, [user.status]);

  // 动态属性对象
  const buttonProps = {
    disabled: user.status === '离线',
    'aria-label': `编辑 ${user.name}`,
    'data-user-role': user.role,
    className: `btn ${isActive ? 'active' : 'inactive'} ${userStatusClass}`
  };

  return (
    <div className="user-card">
      <img
        src={user.avatar || '/default-avatar.png'}
        alt={`${user.name}的头像`}
        className={userStatusClass}
      />

      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.role}</p>
        <p className={userStatusClass}>{user.status}</p>
      </div>

      {/* 条件渲染 */}
      {user.role === '管理员' && (
        <div className="admin-badge">管理员</div>
      )}

      {/* 动态属性按钮 */}
      <button {...buttonProps}>编辑</button>
    </div>
  );
};

// 动态列表渲染组件
const NotificationList: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const [filter, setFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  // 格式化时间
  const formatTime = (date: Date) => {
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    return `${Math.floor(diffMins / 60)}小时前`;
  };

  return (
    <div className="notifications">
      {/* 动态表单元素 */}
      <div className="filters">
        <input
          type="text"
          placeholder="搜索通知..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="全部">全部通知</option>
          <option value="未读">未读通知</option>
          <option value="已读">已读通知</option>
        </select>
      </div>

      {/* 动态列表 */}
      <ul className="notification-list">
        {notifications.length === 0 ? (
          <li className="empty">没有通知</li>
        ) : (
          notifications.map(notification => (
            <li
              key={notification.id}
              className={`notification ${notification.type}`}
            >
              <span className="type">
                {notification.type === '成功' && '✓'}
                {notification.type === '错误' && '✗'}
                {notification.type === '警告' && '⚠'}
                {notification.type === '信息' && 'ℹ'}
              </span>
              <p>{notification.message}</p>
              <span className="time">
                {formatTime(notification.timestamp)}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

// 复杂表单组件
const UserForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    role: '访客' as User['role'],
    status: '离线' as User['status']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = '用户名不能为空';
    } else if (formData.name.length < 2) {
      newErrors.name = '用户名至少需要2个字符';
    }

    if (formData.role === '管理员' && formData.status === '离线') {
      newErrors.status = '管理员不能设置为离线状态';
    }

    return newErrors;
  };

  return (
    <form onSubmit={/* 处理提交 */}>
      <div className="form-group">
        <label htmlFor="name">用户名：</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={/* 处理变更 */}
          placeholder="请输入用户名"
        />
        {errors.name && (
          <span className="error">{errors.name}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="role">角色：</label>
        <select
          id="role"
          value={formData.role}
          onChange={/* 处理变更 */}
        >
          <option value="访客">访客</option>
          <option value="查看者">查看者</option>
          <option value="编辑者">编辑者</option>
          <option value="管理员">管理员</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="status">状态：</label>
        <select
          id="status"
          value={formData.status}
          onChange={/* 处理变更 */}
        >
          <option value="在线">在线</option>
          <option value="离线">离线</option>
          <option value="离开">离开</option>
          <option value="忙碌">忙碌</option>
        </select>
        {errors.status && (
          <span className="error">{errors.status}</span>
        )}
      </div>

      <button type="submit">保存</button>
    </form>
  );
};
```

**期望转换**:
```typescript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// 类型定义
interface User {
  id: number;
  name: string;
  role: 'admin' | 'editor' | 'viewer' | 'guest';
  status: 'online' | 'offline' | 'away' | 'busy';
  lastActive: Date;
}

type NotificationType = 'success' | 'error' | 'warning' | 'info';
type ThemeType = 'light' | 'dark' | 'auto';

// 动态属性组件
const DynamicAttributes: React.FC<{ user: User; theme: ThemeType }> = ({ user, theme }) => {
  const [isActive, setIsActive] = useState(user.status === 'online');

  // 动态计算的类名
  const userStatusClass = useMemo(() => {
    switch (user.status) {
      case 'online': return 'status-online';
      case 'offline': return 'status-offline';
      case 'away': return 'status-away';
      case 'busy': return 'status-busy';
      default: return '';
    }
  }, [user.status]);

  // 动态属性对象
  const buttonProps = {
    disabled: user.status === 'offline',
    'aria-label': $t1('edit_user_aria_label', { name: user.name }),
    'data-user-role': user.role,
    className: `btn ${isActive ? 'active' : 'inactive'} ${userStatusClass}`
  };

  return (
    <div className="user-card">
      <img
        src={user.avatar || '/default-avatar.png'}
        alt={$t1('user_avatar_alt', { name: user.name })}
        className={userStatusClass}
      />

      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{$t1(`role.${user.role}`)}</p>
        <p className={userStatusClass}>{$t1(`status.${user.status}`)}</p>
      </div>

      {/* 条件渲染 */}
      {user.role === 'admin' && (
        <div className="admin-badge">{$t1('admin_badge')}</div>
      )}

      {/* 动态属性按钮 */}
      <button {...buttonProps}>{$t1('edit_button')}</button>
    </div>
  );
};

// 动态列表渲染组件
const NotificationList: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 格式化时间
  const formatTime = (date: Date) => {
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return $t1('just_now');
    if (diffMins < 60) return $t1('minutes_ago', { minutes: diffMins });
    if (diffMins < 1440) return $t1('hours_ago', { 
      hours: Math.floor(diffMins / 60) 
    });
    return $t1('days_ago', { 
      days: Math.floor(diffMins / 1440) 
    });
  };

  return (
    <div className="notifications">
      {/* 动态表单元素 */}
      <div className="filters">
        <input
          type="text"
          placeholder={$t1('search_notifications_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">{$t1('all_notifications')}</option>
          <option value="unread">{$t1('unread_notifications')}</option>
          <option value="read">{$t1('read_notifications')}</option>
        </select>
      </div>

      {/* 动态列表 */}
      <ul className="notification-list">
        {notifications.length === 0 ? (
          <li className="empty">{$t1('no_notifications')}</li>
        ) : (
          notifications.map(notification => (
            <li
              key={notification.id}
              className={`notification ${notification.type}`}
            >
              <span className="type">
                {notification.type === 'success' && '✓'}
                {notification.type === 'error' && '✗'}
                {notification.type === 'warning' && '⚠'}
                {notification.type === 'info' && 'ℹ'}
              </span>
              <p>{$t1(notification.message)}</p>
              <span className="time">
                {formatTime(notification.timestamp)}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

// 复杂表单组件
const UserForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'guest' as User['role'],
    status: 'offline' as User['status']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = $t1('username_required');
    } else if (formData.name.length < 2) {
      newErrors.name = $t1('username_min_length');
    }

    if (formData.role === 'admin' && formData.status === 'offline') {
      newErrors.status = $t1('admin_offline_error');
    }

    return newErrors;
  };

  return (
    <form onSubmit={/* 处理提交 */}>
      <div className="form-group">
        <label htmlFor="name">{$t1('username_label')}</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={/* 处理变更 */}
          placeholder={$t1('username_placeholder')}
        />
        {errors.name && (
          <span className="error">{$t1(errors.name)}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="role">{$t1('role_label')}</label>
        <select
          id="role"
          value={formData.role}
          onChange={/* 处理变更 */}
        >
          <option value="guest">{$t1('role.guest')}</option>
          <option value="viewer">{$t1('role.viewer')}</option>
          <option value="editor">{$t1('role.editor')}</option>
          <option value="admin">{$t1('role.admin')}</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="status">{$t1('status_label')}</label>
        <select
          id="status"
          value={formData.status}
          onChange={/* 处理变更 */}
        >
          <option value="online">{$t1('status.online')}</option>
          <option value="offline">{$t1('status.offline')}</option>
          <option value="away">{$t1('status.away')}</option>
          <option value="busy">{$t1('status.busy')}</option>
        </select>
        {errors.status && (
          <span className="error">{$t1(errors.status)}</span>
        )}
      </div>

      <button type="submit">{$t1('save_button')}</button>
    </form>
  );
};
```

**特别说明**:
1. 类型定义处理：
   - 枚举值和类型定义使用英文
   - 状态和角色等固定值使用英文
   - 错误消息和提示文本需要国际化

2. 动态属性处理：
   - 属性值中的中文需要国际化
   - 动态拼接的文本使用模板
   - aria-label 等辅助属性需要国际化

3. 条件渲染：
   - 条件判断中的值使用英文
   - 渲染的文本需要国际化
   - 动态类名使用英文

4. 列表渲染：
   - 列表项中的文本需要国际化
   - 空状态文本需要国际化
   - 过滤和搜索相关文本需要国际化

5. 表单处理：
   - 表单标签文本需要国际化
   - 占位符文本需要国际化
   - 错误消息需要国际化
   - 选项文本需要国际化

6. 时间格式化：
   - 相对时间文本需要国际化
   - 使用模板处理动态时间

7. 注意事项：
   - 使用命名空间组织翻译键（如 role.admin, status.online）
   - 保持英文值和翻译键的对应关系
   - 考虑文本的复用性

### 4.9 模板字符串场景
**场景说明**: 处理模板字符串中的中文字符串，包括 HTML 模板、邮件模板等场景。

**文件类型**: `.js`, `.jsx`, `.ts`, `.tsx`

**场景示例**:
```typescript
// HTML 表格模板
const renderConclusionList = (list: string) => {
  const arr = JSON.parse(list);
  if (!arr.length) return '<div>暂无数据</div>';
  
  const cols = arr
    .map((v: any) => `
      <tr>
        <td>${v?.user || ''}</td>
        <td>${v?.desc || ''}</td>
        <td>${v?.jielun || ''}</td>
        <td>${v?.remark || ''}</td>
      </tr>`)
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>提出人</th>
          <th>确认项描述</th>
          <th>结论</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>${cols}</tbody>
    </table>
  `;
};

// 待办事项模板
const renderTodoList = (list = [], treeIdMap: any) => {
  if (!list.length) return '<div>暂无数据</div>';
  
  const cols = list
    .map((v: any) => `
      <tr>
        <td>${treeIdMap?.[v.level3]?.Name || '其它诉求'}</td>
        <td>${treeIdMap?.[v.level4]?.Name || '自闭环待办'}</td>
        <td>${v?.toDoManager || ''}</td>
        <td>${v?.priority || ''}</td>
        <td>${v?.toDoDescription || ''}</td>
        <td>${v?.cusReqTime || ''}</td>
      </tr>`)
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>三级目录</th>
          <th>四级目录</th>
          <th>处理人</th>
          <th>优先级</th>
          <th>待办描述</th>
          <th>计划完成时间</th>
        </tr>
      </thead>
      <tbody>${cols}</tbody>
    </table>
  `;
};

// 邮件模板
const EmailContent: React.FC<IProps> = ({ data }) => {
  return (
    <div>
      <div>
        <span><b>大家好,</b></span>
      </div>
      <p>
        我是您的专属售后支持，以下为本次与 {data?.CustomerName || ''} 的会议纪要，请查收。
      </p>
      <div>
        <div>
          <span>会议时间：</span>
          <span>{data?.meetingWhen || '-'}</span>
        </div>
        <div>
          <span>会议地点：</span>
          <span>{data?.meetingLocation || ''}</span>
        </div>
        <div>
          <div>与会人员：</div>
          <div>
            <div>【客户侧】{data?.customerPeople || ''}</div>
            <div>【腾讯侧】{data?.tencentPeople || ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 错误消息模板
function handleError(api: string, code: number) {
  if (code === 404) {
    throw new Error(`请求接口${api}失败: ${code}`);
  } else {
    throw new Error(`请求接口失败`);
  }
}

// 动态文本模板
const formatMessage = (type: string, data: any) => {
  switch (type) {
    case 'welcome':
      return `欢迎使用我们的应用，${data.name}！`;
    case 'role':
      return `您的角色是${data.role}`;
    case 'error':
      return `操作失败：${data.message}`;
    default:
      return '未知消息';
  }
};

// 时间格式化模板
const formatTime = (date: Date) => {
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
  return `${Math.floor(diffMins / 1440)}天前`;
};
```

**期望转换**:
```typescript
import { useTranslation } from 'react-i18next';
const { $t1 } = useTranslation();

// HTML 表格模板
const renderConclusionList = (list: string) => {
  const arr = JSON.parse(list);
  if (!arr.length) return `<div>${$t1('no_data')}</div>`;
  
  const cols = arr
    .map((v: any) => `
      <tr>
        <td>${v?.user || ''}</td>
        <td>${v?.desc || ''}</td>
        <td>${v?.jielun || ''}</td>
        <td>${v?.remark || ''}</td>
      </tr>`)
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>${$t1('proposer')}</th>
          <th>${$t1('confirmation_description')}</th>
          <th>${$t1('conclusion')}</th>
          <th>${$t1('remarks')}</th>
        </tr>
      </thead>
      <tbody>${cols}</tbody>
    </table>
  `;
};

// 待办事项模板
const renderTodoList = (list = [], treeIdMap: any) => {
  if (!list.length) return `<div>${$t1('no_data')}</div>`;
  
  const cols = list
    .map((v: any) => `
      <tr>
        <td>${treeIdMap?.[v.level3]?.Name || $t1('other_demands')}</td>
        <td>${treeIdMap?.[v.level4]?.Name || $t1('self_closing_todo')}</td>
        <td>${v?.toDoManager || ''}</td>
        <td>${v?.priority || ''}</td>
        <td>${v?.toDoDescription || ''}</td>
        <td>${v?.cusReqTime || ''}</td>
      </tr>`)
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>${$t1('level_three_directory')}</th>
          <th>${$t1('level_four_directory')}</th>
          <th>${$t1('handler')}</th>
          <th>${$t1('priority')}</th>
          <th>${$t1('todo_description')}</th>
          <th>${$t1('planned_completion_time')}</th>
        </tr>
      </thead>
      <tbody>${cols}</tbody>
    </table>
  `;
};

// 邮件模板
const EmailContent: React.FC<IProps> = ({ data }) => {
  return (
    <div>
      <div>
        <span><b>{$t1('hello_everyone')}</b></span>
      </div>
      <p>
        {$t1('meeting_summary_intro', { 
          customer: data?.CustomerName || '' 
        })}
      </p>
      <div>
        <div>
          <span>{$t1('meeting_time')}：</span>
          <span>{data?.meetingWhen || '-'}</span>
        </div>
        <div>
          <span>{$t1('meeting_location')}：</span>
          <span>{data?.meetingLocation || ''}</span>
        </div>
        <div>
          <div>{$t1('attendees')}：</div>
          <div>
            <div>{$t1('customer_side', { 
              people: data?.customerPeople || '' 
            })}</div>
            <div>{$t1('tencent_side', { 
              people: data?.tencentPeople || '' 
            })}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 错误消息模板
function handleError(api: string, code: number) {
  if (code === 404) {
    throw new Error($t1('api_request_failed_with_code', { 
      api, 
      code 
    }));
  } else {
    throw new Error($t1('api_request_failed'));
  }
}

// 动态文本模板
const formatMessage = (type: string, data: any) => {
  switch (type) {
    case 'welcome':
      return $t1('welcome_message', { name: data.name });
    case 'role':
      return $t1('role_message', { role: data.role });
    case 'error':
      return $t1('error_message', { message: data.message });
    default:
      return $t1('unknown_message');
  }
};

// 时间格式化模板
const formatTime = (date: Date) => {
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return $t1('just_now');
  if (diffMins < 60) return $t1('minutes_ago', { minutes: diffMins });
  if (diffMins < 1440) return $t1('hours_ago', { 
    hours: Math.floor(diffMins / 60) 
  });
  return $t1('days_ago', { 
    days: Math.floor(diffMins / 1440) 
  });
};
```

**特别说明**:
1. HTML 模板处理：
   - 表格标题和提示文本需要国际化
   - 默认值和占位符需要国际化
   - 保持 HTML 结构不变

2. 邮件模板处理：
   - 固定文本需要国际化
   - 动态内容使用模板
   - 保持邮件格式和样式

3. 错误消息模板：
   - 使用模板处理动态内容
   - 保持错误信息的完整性
   - 考虑不同错误类型

4. 动态文本模板：
   - 使用类型区分不同场景
   - 动态内容使用模板
   - 提供默认值处理

5. 时间格式化：
   - 相对时间文本需要国际化
   - 使用模板处理数值
   - 考虑不同时间单位

6. 注意事项：
   - 模板中的固定文本需要国际化
   - 动态内容使用模板参数
   - 保持原有的格式和样式
   - 考虑模板的复用性

[继续添加更多场景...] 