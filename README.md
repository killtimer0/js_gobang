# JS 五子棋

这是一个用 JS 开发的五子棋小游戏, 目标是能方便地嵌入其他网页中并流畅运行
程序并没有调用外部资源或第三方库, 你在 F12 中看到的元素都是 JS 动态创建的

游戏的 AI 不是非常专业, 但也不是傻瓜. 算法按照贴吧[e自由电子](https://tieba.baidu.com/p/4218602810)的思路写成 JS 描述的版本, 递归这东西我还是把握不好 (笑), 当时 1.0 版本的时候 bug 一堆. 现在应该也有, 但棋力已经有点水平了

项目从2.2.2开始记录在git中, 老版本已经被覆盖掉啦, 而且以前bug一堆就不发了吧

目前没有兼容 IE 的想法, 在 IE 中运行出来是什么样我自己也不知道

下面是一个简单的例子(版本可能不一致)

[演示页面](https://killtimer0.github.io/game#1)

## 使用

### 基础

将`gobang.js`加入到你网站上一个合适的目录, 然后在你的 HTML 的 head 中引用它:

```html
<script src="/YOUR_PATH/gobang.js"></script>
```

定义一个`div`节点, 并指定一个`id`, 像这样:

```html
<div id="game_container"></div>
```

然后, 在下面再加入一段这样的代码:

```html
<script>loadGobangGame('game_container','/YOUR_PATH/gobang.js',function(bg,bd,fb,tb){
    // TODO: 你可以在这里定义控件的属性
})</script>
```

上面两处`YOUR_PATH`是你实际放置脚本的目录. `TODO`可以暂时不做, 先试下这个在你的网站上是否能正常显示. 如果不能, 查看一下控制台输出或者反馈 bug.

可以在`TODO`中放置以下内容:

```html
bg.style.background='white';
bd.style.border='1px dashed grey';
```

`bg`指的是整个界面容器, 在这里我们设置了白色的背景; `bd`是左边的棋盘, 我们为它添加了一个虚线边框. 所以整个界面看起来是这样:
![游戏界面](https://killtimer0.github.io/stuffs/gobang2/ingame.png)

我调试时的代码为

```html
<!DOCTYPE html>
<html>
  <script src="gobang.js"></script>
  <body style="background: #EEE;">
    <h1>Title</h1>
    <div id="game_container"></div>
    <script>loadGobangGame('game_container','/gobang.js',function(bg,bd,fb,tb){bg.style.background='white',bd.style.border='1px dashed grey'})</script>
  </body>
</html>
```

使用上面的方法已经可以在网页上运行游戏了

### 来点刺激的

如果想让游戏更具个性, 可以看看`loadGobangGame`的定义:

```javascript
function loadGobangGame(id, ai_path, callback, config){}
```

|    参数    | 解释                                                         |
| :--------: | ------------------------------------------------------------ |
|    `id`    | 你的`div`容器的id                                            |
| `ai_path`  | 如果你有更好的ai, 可以在这里指定你的`WebWorker`( 参数传递的方式在后面细说), 否则你应该填入项目中gobang.js文件的路径. 没错这个js文件不仅实现了界面, 还提供了一个默认的ai实现, 二者在同一个js中并共享一些函数. |
| `callback` | 可选. 当一切准备就绪后, 如果这个参数不为空, js 将调用这个函数来告知你一些数据, 可以通过这个参数设置游戏的背景图 |
|  `config`  | 可选. 可以传入一系列配置对, 比如棋盘行列数, 这些设置会覆盖默认设置 |

#### WebWorker接口

在你的`WebWorker`添加以下代码:

```javascript
this.addEventListener('message', function(event){
	var [N, board, self, depth] = event.data;
    // TODO: 实现你的 AI 算法
	this.postMessage([succeeded, result]);
});
```

|    变量     | 解释                                                         |
| :---------: | ------------------------------------------------------------ |
|     `N`     | *in*  棋盘的行列数, 一般是15                                 |
|   `board`   | *in*  一个大小为`N*N`的二维数组, 代表棋盘上的数据, 0为空, 1为一个玩家, 2为另一个玩家(和先后手或是否是计算机没有关系), `board[y][x]` 代表第`y`行第`x`列 |
|   `self`    | *in*  指定己方是谁, 可以是1或2. AI要为棋盘上值为`self`这一方落子 |
|   `depth`   | *in*  思考深度, 这个只是一个参考值, 原则上`depth`越大你的 AI 要思考越深 |
| `succeeded` | *out* 是否有可行方案(没有的情况: 棋盘上无空点)               |
|  `result`   | *out* 如果`succeeded`为`true`, 这个代表返回坐标`[y, x]`      |

程序在需要计算机落子时, 会`postMessage`到你的`WebWorker`, 你在运算完成后返回你的结果. 注意在你的算法执行时, 主脚本是有可能终止你的算法的(例如思考时玩家选择悔棋).

#### callback参数

```javascript
function callback(bg,bd,fb,tb){}
```

| 参数 | 解释                                                 |
| :--: | ---------------------------------------------------- |
| `bg` | 界面元素, 代表整个游戏界面, 可用于设置背景色或背景图 |
| `bd` | 棋盘元素, 代表一个`canvas`, 可用于设置棋盘背景       |
| `fb` | 代表右边操作栏, 暂时想不出什么用途                   |
| `tb` | 代表游戏底部的信息提示条, 暂时也想不出什么用途(      |

#### config表

游戏默认配置为(注意这个可能根据版本不同而有微小改变):

```javascript
const defcfg = {
	N: 15,
	level: 2,
	playerFirst: true,
	number: false,
	boardSize: 576,
	rWidth: 180,
	godMode: false,
	lineColor: '#000C',
	mptColor: '#0C8',
	moppColor: '#F80',
	mtipColor: '#F0F',
	scale: 2,
	storage: 1,
};
```

|      项       | 解释                                                         |
| :-----------: | ------------------------------------------------------------ |
|      `N`      | 棋盘大小. 一般都是15, 不建议更改                             |
|    `level`    | 默认思考深度, 这个值必须大于0                                |
| `playerFirst` | 为`true`则默认玩家优先                                       |
|   `number`    | 为`true`则默认显示棋序数字                                   |
|  `boardSize`  | 棋盘的显示大小, 以像素为单位                                 |
|   `rWidth`    | 右边操作栏大小, 以像素为单位                                 |
|   `godMode`   | 上帝模式, 为`true`则可在已落子的地方再次落子, 诶就是玩       |
|  `lineColor`  | 棋盘线的颜色                                                 |
|  `mptColor`   | 光标的颜色                                                   |
|  `moppColor`  | 对手落子提示的颜色                                           |
|  `mtipColor`  | 点击提示按钮时标注的颜色                                     |
|    `scale`    | 缩放比, 这个定义了`canvas`的实际大小(`scale * boardSize`), 数值越大越清晰, 但不要设置过大, 因为对性能有影响 |
|   `storage`   | 数据存储方式. 0为不存储, 1使用`sessionStorage`(关闭浏览器失效), 2使用`localStorage`(长期保存), 如果浏览器不支持, 会默认不存储 |

例如我想让棋盘变为19行19列, 并开启上帝模式, 而其他默认不变, 可以这样:

```javascript
loadGobangGame(id, ai, cbk, {
  N: 19,
  godMode: true,
})
```

程序获取配置的优先级: storage > 你传入的参数 > defcfg 中的默认值

## 最小化(非必要)

在测试完成后, 可以在目录下运行`minify`执行最小化. 完成后要手动将混淆后`gobang.min.js`里面的`defcfg`还原成之前的:

```javascript
{N:15,level:2,playerFirst:!0,number:!1,boardSize:576,rWidth:180,godMode:!1,lineColor:'#000C',mptColor:'#0C8',moppColor:'#F80',mtipColor:'#F0F',scale:2,storage:1}
```

也就是源代码`defcfg`上面一行注释
如果觉得这个过程太繁琐了也没必要做

## 测试有问题?

在本地运行测试时, 由于`WebWorker`的机制, 根目录不能正确识别(也就是直接打开index.html时会发现界面不全):

```
Uncaught DOMException: Failed to construct 'Worker'
```

解决方法是使用`http-server`然后访问localhost

## 反馈

游戏过程中如果有碰到 bug 影响使用, 麻烦向作者反馈一份, 感谢!<img src="https://killtimer0.github.io/pictures/bili-small-shrink/7/151.png" style="display: inline;"></img>


作者: killtimer
QQ: 1837009039
[发送邮件](mailto: 1837009039@qq.com)

