const vname = 'JS五子棋', version = '2.2.2',
KEY = 'GobangConfig'; // *Storage的键名(JSON格式)
const updateinfo = [
	['2.2',
		'.0 又双叒叕修复了 AI 的一个严重 bug',
		'.1 增加棋序数字等信息, 增加帮助页面',
		'.1 点击棋盘获取焦点后支持键盘操作',
		'.2 支持使用 storage 保存用户设置',
	],['2.1',
		'.0 修复 AI 在必输局面下乱走的 bug',
		'.0 拖动落子逻辑修改',
	],['2.0',
		'使用 WebWorker, 速度优化',
		'重构代码, 修复了 AI 的一些严重 bug',
		'布局优化, 解决 canvas 模糊的问题',
		'可自定义先手和难度',
		'移动端增加拖动落子',
	],
]
const helpmsg = [
	{msg: '这是一个用 JS 开发的五子棋小游戏, 目标是能方便地嵌入其他网页中并流畅运行, 所以程序并没有调用外部资源或第三方库, 直接 JS 动态创建元素.<br>游戏中使用了 WebWorker 进行密集型计算(也就是 AI 部分). 相比于 1.0, 由于这种方式另开一个线程, 因此界面流畅程度有了很大的提升, 效率也高了很多.<br>灵感来自于<a target="_blank" href="https://tieba.baidu.com/p/4218602810">贴吧</a>, 按着逻辑重写了一遍并加入了更多内容<br>游戏仍在开发中, 目前在考虑加入禁手规则<del>和万宁阵法<img src="/pictures/bili-small-shrink/1/2373.png" style="display: inline; width: 48px; height: 48px;" /></del>'},
	{name: '操作相关', msg: '<h4>鼠标</h4>点击落子, 右边可以自定义先手(下一局开始生效)和难度. 在移动端可以通过按住棋盘并滑动来调整落子位置.<h4>键盘</h4><table><col width="150"/><tr><td>WASD / 方向键</td><td>移动光标</td></tr><tr><td>空格 / 回车</td><td>落子</td></tr><tr><td>Q</td><td>悔棋</td></tr>'},
	{name: '反馈', msg: '游戏过程中如果有碰到 bug 影响使用, 麻烦向作者反馈一份, 感谢!<img src="/pictures/bili-small-shrink/7/151.png" style="display: inline; width: 48px; height: 48px;"></img><br>QQ1837009039<br><a href="mailto: 1837009039@qq.com">发送邮件</a>'},
];
const endmsg = ["平局(〃'▽'〃)", "你赢了(￣▽￣)／", "胜负已定(￣.￣)"];
const difmsg = [, , '简单', , '一般', , '较难', , '大爷'];
// N:15,level:2,playerFirst:!0,boardSize:576,rWidth:180,godMode:!1,lineColor:'#000C',mptColor:'#0C8',moppColor:'#F80',mtipColor:'#F0F',scale:2,storage:1
const defcfg = {
	N: 15,
	level: 2,
	playerFirst: true,
	boardSize: 576,
	rWidth: 180,
	godMode: false,
	lineColor: '#000C',
	mptColor: '#0C8',
	moppColor: '#F80',
	mtipColor: '#F0F',
	scale: 2,
	storage: 1, // 0 for no storage, 1 for sessionStorage, 2 for localStorage
};
const storemsg = ['无', 'sessionStorage', 'localStorage'];
function px(val){return val + 'px'}
function narr(n, ator){var ret = Array(n), i; for (i = 0; i < n; i++) ret[i] = ator(i); return ret;}
function zerof(){return 0}
function circle(ctx, x, y, r){ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();}
function setIntervalx(f, t){f(); return setInterval(f, t);}
function buttonf(f, id){return function(e){f(id)}}
function newe(t){return document.createElement(t)}
function appe(p, e){p.appendChild(e)}
const State = {
	Prepare: 0,
	Player: 1,
	Opposite: 2,
	End: 3,
};
const btns = {
	reset: '重来',
	backup: '退回',
	tips: '提示',
	dispstep: '棋序',
	info: '信息',
	help: '帮助',
};

if (!this.document){
	this.addEventListener('message', function(event){
		var [N, board, self, depth] = event.data;
		var result = analyse(N, board, depth, self);
		if (result) this.postMessage([true, result]);
		else this.postMessage([false]);
	});
	function gettypes(l, n, r, ttl){
		var cache = narr(n, function(){return [0, 0]}), i5 = 0;
		for (var i = 4; i < n; i++){
			var s = 0, b = false, f, _f = 0;
			for (var j = 0; j < 5; j++){
				switch (l[i - j]){
					case 1: f = i - j; s++; if (_f == 0) _f = i - j; break;
					case 2: i += 4 - j; b = true; break;
				}
				if (b) break;
			}
			if (b || s < 2) continue;
			if (s == 5){i5++; continue;}
			var v = s * 2 - 2;
			if (v > cache[f][0]) cache[f] = [v, _f];
		}
		for (var i = 5; i < n; i++){
			var s = 0, b = false, f, _f = 0;
			if (l[i - 5] != 0 || l[i] != 0) continue;
			for (var j = 0; j < 6; j++){
				switch (l[i - j]){
					case 1: f = i - j; s++; if (_f == 0) _f = i - j; break;
					case 2: i += 5 - j; b = true; break;
				}
				if (b) break;
			}
			if (b || s == 0 || (s == 2 && _f - f > 1)) continue;
			var v = s * 2 - 1;
			if (v > cache[f][0]) cache[f] = [v, _f];
		}
		for (var i = 0; i < 8; i++) r[i] = 0;
		var p = 0;
		for (var i = 0; i < n; i++){
			if (cache[i][0] != 0){
				if (cache[i][1] > p)
					r[cache[i][0] - 1]++,
					ttl[cache[i][0] - 1]++,
					p = cache[i][1];
			}
		}
		r[7] += i5, ttl[7] += i5;
	}
	// [side][abpq][N][type]
	function init(board, N){
		var types = narr(2, function(){
			return narr(4, function(i){
				return narr(i < 2 ? N : 2 * N - 9, function(){
					return narr(8, zerof)
				})
			})
		});
		var all = narr(2, function(){return narr(8, zerof)});
		var l = Array(N);
		for (var k = 0; k < 2; k++){
			var map = [0, 2, 2]; map[k + 1] = 1;
			for (var i = 0; i < N; i++){
				for (var j = 0; j < N; j++){
					l[j] = map[board[i][j]];
				}
				gettypes(l, N, types[k][0][i], all[k]);
				for (var j = 0; j < N; j++){
					l[j] = map[board[j][i]];
				}
				gettypes(l, N, types[k][1][i], all[k]);
			}
			for (var i = 0; i < 2 * N - 9; i++){
				var p = N - 5 - i, q = 0, n = i + 5;
				if (p < 0) q = -p, p = 0, n = 2 * N - 5 - i;
				for (var j = 0; j < n; j++){
					l[j] = map[board[p + j][q + j]];
				}
				gettypes(l, n, types[k][2][i], all[k]);
				p = 0, q = 4 + i, n = i + 5;
				if (q >= N) p = q - N + 1, q = N - 1, n = 2 * N - 5 - i;
				for (var j = 0; j < n; j++){
					l[j] = map[board[p + j][q - j]];
				}
				gettypes(l, n, types[k][3][i], all[k]);
			}
		}
		return [types, all];
	}
	// [xy, all, [], [], [], []]
	function update(board, N, x, y, t, types, all){
		var rev = {}, l = Array(N);
		function copy(s){var d = Array(8); for (var i = 0; i < 8; i++) d[i] = s[i]; return d;}
		function sub(d, s){for (var i = 0; i < 8; i++) d[i] -= s[i];}
		rev.pos = [x, y], rev.all = [copy(all[0]), copy(all[1])]; board[y][x] = t;
		// horizonal
		rev[0] = [copy(types[0][0][y]), copy(types[1][0][y])];
		sub(all[0], types[0][0][y]); sub(all[1], types[1][0][y]);
		for (var k = 0; k < 2; k++){
			var s = k + 1, map = [0, 2, 2]; map[s] = 1;
			for (var i = 0; i < N; i++) l[i] = map[board[y][i]];
			gettypes(l, N, types[k][0][y], all[k]);
		}
		// vertial
		rev[1] = [copy(types[0][1][x]), copy(types[1][1][x])];
		sub(all[0], types[0][1][x]); sub(all[1], types[1][1][x]);
		for (var k = 0; k < 2; k++){
			var s = k + 1, map = [0, 2, 2]; map[s] = 1;
			for (var i = 0; i < N; i++) l[i] = map[board[i][x]];
			gettypes(l, N, types[k][1][x], all[k]);
		}
		// main diag
		var p = N + x - y - 5;
		if (p >= 0 && p < 2 * N - 9){
			rev[2] = [copy(types[0][2][p]), copy(types[1][2][p])];
			sub(all[0], types[0][2][p]); sub(all[1], types[1][2][p]);
			var v = N - 5 - p, u = 0, n = p + 5;
			if (v < 0) u = -v, v = 0, n = 2 * N - 5 - p;
			for (var k = 0; k < 2; k++){
				var map = [0, 2, 2]; map[k + 1] = 1;
				for (var i = 0; i < n; i++) l[i] = map[board[v + i][u + i]];
				gettypes(l, n, types[k][2][p], all[k]);
			}
		}
		// sub diag
		p = x + y - 4;
		if (p >= 0 && p < 2 * N - 9){
			rev[3] = [copy(types[0][3][p]), copy(types[1][3][p])];
			sub(all[0], types[0][3][p]); sub(all[1], types[1][3][p]);
			var v = 0, u = 4 + p, n = p + 5;
			if (u >= N) v = u - N + 1, u = N - 1, n = 2 * N - 5 - p;
			for (var k = 0; k < 2; k++){
				var map = [0, 2, 2]; map[k + 1] = 1;
				for (var i = 0; i < n; i++) l[i] = map[board[v + i][u - i]];
				gettypes(l, n, types[k][3][p], all[k]);
			}
		}
		return rev;
	}
	const Policy = {Balance: 0, Attack: 1, Defence: 2};
	const GScore = [10, 10, 60, 70, 150, 180, 1000, 1200]; // F1 B2 F2 B3 F3 B4 F4 I5
	function evamode(all, side){
		var self = side - 1, opst = 2 - side, sc = [0, 0];
		for (var k = 0; k < 2; k++) for (var i = 0; i < 5; i++) sc[k] += all[k][i] * GScore[i];
		var mark = sc[self] - sc[opst];
		return mark == 0 ? Policy.Balance : (mark > 0 ? Policy.Attack : Policy.Defence);
	}
	function evaluate(all, side, policy){
		var self = side - 1, opst = 2 - side, mark = 0;
		// opp 5
		if (all[opst][7] > 0) mark = -500000;
		// 5
		else if (all[self][7] > 0) mark = 500000;
		// opp F4
		else if (all[opst][6] > 0) mark = -400000;
		// opp B4
		else if (all[opst][5] > 0) mark = -300000;
		// F4/B4B4
		else if (all[self][6] > 0 || all[self][5] > 1) mark = 300000;
		// B4F3
		else if (all[self][5] > 0 && all[self][4] > 0) mark = 200000;
		// opp F3
		else if (all[opst][4] > 0) mark = -100000;
		// F3F3
		else if (all[self][4] > 1) mark = 100000;
		var mark2 = 0;
		var slf = 0, opf = 0, sc = [0, 0];
		switch (policy){
			case Policy.Balance: slf = opf = 5; break;
			case Policy.Attack: slf = 6, opf = 4; break;
			case Policy.Defence: slf = 4, opf = 6; break;
		}
		for (var k = 0; k < 2; k++) for (var i = 0; i < 8; i++) sc[k] += all[k][i] * GScore[i];
		mark2 = sc[self] * slf - sc[opst] * opf;
		if (mark2 >= 100000) mark2 = 99999;
		if (mark2 <= -100000) mark2 = -99999;
		return mark + mark2;
	}
	function backup(board, N, types, all, rev){
		for (var k = 0; k < 2; k++) for (var i = 0; i < 8; i++) all[k][i] = rev.all[k][i];
		var [x, y] = rev.pos;
		types[0][0][y] = rev[0][0], types[1][0][y] = rev[0][1];
		types[0][1][x] = rev[1][0], types[1][1][x] = rev[1][1];
		var p = N + x - y - 5;
		if (p >= 0 && p < 2 * N - 9) types[0][2][p] = rev[2][0], types[1][2][p] = rev[2][1];
		p = x + y - 4;
		if (p >= 0 && p < 2 * N - 9) types[0][3][p] = rev[3][0], types[1][3][p] = rev[3][1];
		board[y][x] = 0;
	}
	function selpos(board, N, side, n, types, all){
		var r = [], near = narr(N, function(){return narr(N, zerof)}), rev;
		var policy = evamode(all, types);
		for (var i = 0; i < N; i++) for (var j = 0; j < N; j++){
			if (board[i][j] != 0){
				var p = i - 2, q = j - 2, _p = i + 3, _q = j + 3;
				if (p < 0) p = 0; if (q < 0) q = 0; if (_p > N) _p = N; if (_q > N) _q = N;
				for (var _i = p; _i < _p; _i++) for (var _j = q; _j < _q; _j++) near[_i][_j] = 1;
			}
		}
		for (var i = 0; i < N; i++) for (var j = 0; j < N; j++){
			if (board[i][j] != 0 || near[i][j] == 0) continue;
			rev = update(board, N, j, i, side, types, all);
			mark = evaluate(all, side, policy);
			backup(board, N, types, all, rev);
			r.push([mark, [i, j]]);
		}
		r.sort(function(a, b){return b[0] - a[0]});
		if (r.length <= n) return r;
		r.length = n;
		return r;
	}
	function analyse(N, board, depth, side){
		function checkfst(){
			// 只有0/1个子就随便分析一下
			var c = 0, p;
			for (var i = 0; i < N; i++) for (var j = 0; j < N; j++){
				if (board[i][j] != 0) c++, p = [j, i];
			}
			var m = Math.floor(N / 2);
			if (c == 0) return [[m, m]];
			else if (c == 1){
				if (p[0] == m && p[1] == m){
					var r = Math.floor(Math.random() * 8);
					if (r > 7) r = 7;
					if (r >= 4) r++;
					var dx = r % 3; var dy = (r - dx) / 3; dx--, dy--;
					return [[m + dx, m + dy]];
				}else{
					m = N / 2;
					var dx = p[0] < m ? 1 : (p[0] > m ? -1 : 0);
					var dy = p[1] < m ? 1 : (p[1] > m ? -1 : 0);
					return [[p[1] + dy, p[0] + dx]];
				}
			}
			return [false, c];
		}
		const branches = [16, 12, 10, 9, 8, 7, 6, 5, 5];
		function anl_proc(self, cd, alpha, beta){
			if (cd == depth) return evaluate(all, 3 - self, Policy.Balance);
			var n = (cd < branches.length ? branches[cd] : 4), rev, t;
			var pl = selpos(board, N, self, n, types, all); n = pl.length;
			var opp = 3 - self, nd = cd + 1, flag = (depth - cd) % 2 == 0;
			for (var i = 0; i < n; i++){
				var x = pl[i][1][1], y = pl[i][1][0];
				rev = update(board, N, x, y, self, types, all);
				if (all[self - 1][7] > 0) t = evaluate(all, flag ? opp : self, Policy.Balance) + 500000 * (flag ? (nd - depth) : (depth - nd));
				else t = anl_proc(opp, nd, alpha, beta);
				if (flag){
					if (t < beta){beta = t; if (cd == 0) pt = [y, x];}
				}else{
					if (t > alpha){alpha = t; if (cd == 0) pt = [y, x];}
				}
				backup(board, N, types, all, rev);
				if (alpha >= beta) break;
			}
			return flag ? beta : alpha;
		}
		var [pt, c] = checkfst();
		if (pt) return pt;
		c = N * N - c;
		if (depth > c) depth = c;
		if (depth == 0) return false;
		var [types, all] = init(board, N);
		var limit = 1000000 + depth * 500000;
		anl_proc(side, 0, -limit, limit);
		return pt;
	}
}

// AI 算法部分到此结束, 下面是主逻辑部分

function loadGobangGame(id, workerpath, callback, cfg){
	var container = document.getElementById(id);
	if(!container){console.warn(`No object names '${id}'`);return false;}

	function loadConfig(item, nostore){
		if (!nostore && storage != 0){
			var v = tryRead(item);
			if (v !== undefined) return v;
		}
		if (cfg && cfg[item] !== undefined){
			return cfg[item];
		}else return defcfg[item];
	}

	var storage = loadConfig('storage', true), store;
	switch (storage){
		case 0: store = null; break;
		case 1: if (sessionStorage) store = sessionStorage; else storage = 0; break;
		case 2: if (localStorage) store = localStorage; else storage = 0; break;
		default: storage = 0; break;
	}

	function tryRead(k){
		if (storage == 0) return;
		var s, r, raw = store.getItem(KEY);
		try{s = JSON.parse(raw)} catch (e){s = {}}
		if (s) r = s[k];
		return r;
	}

	function tryWrite(k, v){
		if (storage == 0) return;
		var raw = store.getItem(KEY), s;
		try{s = JSON.parse(raw)} catch (e){}
		if (!s) s = {};
		s[k] = v; store.setItem(KEY, JSON.stringify(s));
	}

	function tryGetJson(){
		if (storage == 0) return;
		return store.getItem(KEY);
	}

	function tryRemove(){
		if (storage == 0) return;
		store.removeItem(KEY);
	}

	var N = loadConfig('N'),
		size = loadConfig('boardSize'),
		rWidth = loadConfig('rWidth'),
		scale = loadConfig('scale'),
		godmode = loadConfig('godmode'),
		lineColor = loadConfig('lineColor'),
		mptColor = loadConfig('mptColor'),
		moppColor = loadConfig('moppColor'),
		mtipColor = loadConfig('mtipColor'),
		nfirst = loadConfig('playerFirst'),
		depth = loadConfig('level')
	;

	var state, win = 0;
	var worker;

	var boardSize = size * scale;
	var border = size / 30;
	var canvas = newe('canvas');
	canvas.width = canvas.height = boardSize;
	canvas.style.width = canvas.style.height = px(size);
	canvas.style.margin = px(border);
	var ctx = canvas.getContext('2d');

	var funcbar = newe('table');
	funcbar.style.width = px(rWidth);
	funcbar.style.height = px(size);
	funcbar.style.padding = px(border);
	funcbar.style.paddingBottom = '0';

	var tipbar = newe('span');
	var table = newe('table');
	table.tabIndex = 0;
	table.style.margin = 'auto';
	table.style.userSelect = 'none';
	table.style.position = 'relative';
	initSubDialog();

	var funcbar = newe('td');

	function newp(g, t, c){
		var p = newe(c ? c : 'p');
		p.innerHTML = t;
		appe(g, p);
	}
	function newg(t){
		var g = newe('fieldset'), h = newe('legend');
		g.style.marginBottom = px(border);
		h.innerHTML = t;
		appe(g, h);
		return g;
	}
	{
		function versionObj(foot){
			var e = newe('span');
			e.style.color = lineColor, e.style.fontSize = px(border * 0.7);
			e.innerText = `${vname} v${version}`;
			appe(foot, e);
		}
		var row = newe('tr');
		var item = newe('td');
		appe(item, canvas); appe(row, item);

		item = newe('td');
		item.style.width = px(rWidth); item.style.height = px(size);
		var t = newe('table');
		t.style.width = px(rWidth);
		t.style.height = px(size);
		t.style.padding = px(border);
		t.style.paddingBottom = '0';
		var r2 = newe('tr');
		appe(r2, funcbar); appe(t, r2);
		r2 = newe('tfoot');
		r2.style.textAlign = 'center';
		r2.style.cursor = 'pointer';
		versionObj(r2);
		r2.addEventListener('click', function(e){showDialogWithOkBtn(function(box, b, destroyf){
			newp(box, vname, 'h2');
			newp(box, '版本: ' + version + '<br>作者: KillTimer');
			newp(box, '更新内容', 'h2');
			var v = '';
			for (var i in updateinfo){
				v += `<h3>${updateinfo[i][0]}</h3>`;
				for (var j = 1; j < updateinfo[i].length; j++){
					if (j != 1) v += '<br>';
					v += updateinfo[i][j];
				}
			}
			newp(box, v);
			b.unshift({name: '帮助', func: function(){destroyf(), helpDlg()}});
		})});
		appe(t, r2);
		appe(item, t); appe(row, item);

		appe(table, row);
		row = newe('tr');
		item = newe('td');
		item.rowSpan = '2';
		appe(item, tipbar); appe(row, item);

		appe(table, row);
		appe(container, table);
	}
	function workerReset(){
		if (worker) worker.terminate();
		worker = new Worker(workerpath);
		worker.addEventListener('message', workerCallback);
	}
	function workerCallback(e){
		var data = e.data;
		if (inTip && state == State.Player){
			var pos = data[1];
			clearInterval(timer);
			if (data[0]) tipsxy(pos[1], pos[0]), markTip = pos, drawBoard();
			else tips('没有可行方案');
			inTip = false;
		}else if (!inTip && state == State.Opposite && data[0]){
			var pos = data[1];
			markOpposite = pos;
			turn(pos[1], pos[0]);
		}
	}
	var vmask, vbox, inUI;
	function initSubDialog(){
		function overlayObj(o, z){
			o.style.position = 'absolute';
			o.style.left = o.style.top = 0;
			o.style.width = o.style.height = '100%';
			o.style.padding = o.style.margin = 0;
			o.style.zIndex = z;
		}
		vmask = newe('div');
		overlayObj(vmask, 10000);
		vmask.style.background = 'white';
		vmask.style.opacity = 0.7;
		vmask.hidden = true;
		vbox = newe('div');
		overlayObj(vbox, 12000);
		vbox.style.userSelect = 'text';
		vbox.hidden = true;
		vbox.style.overflowY = 'auto';
		appe(table, vbox);
		appe(table, vmask);
		inUI = false;
	}
	function showDialog(initf){
		if (inUI) return;
		function destroyf(){
			vbox.innerHTML = '';
			vmask.hidden = vbox.hidden = true, inUI = false;
		}
		initf(vbox, destroyf);
		vmask.hidden = vbox.hidden = false, inUI = true;
	}
	function showDialogWithOkBtn(initf){
		showDialog(function(c, destroyf){
			var old = c.style.display;
			c.style.display = 'flex';
			c.style.flexDirection = 'column';
			var box = newe('div');
			box.style.padding = px(border);
			box.style.overflowY = 'auto';
			box.style.flexGrow = 1;
			var bar = newe('div');
			bar.style.padding = px(border);
			bar.style.display = 'flex';
			bar.style.justifyContent = 'flex-end';
			function destroyf2(){c.style.display = old, destroyf()}
			var btns = [{name: '确定', func: destroyf2}];
			initf(box, btns, destroyf2);
			for (var i = 0; i < btns.length; i++){
				var btn = newe('button');
				btn.innerText = btns[i].name;
				btn.style.paddingLeft = btn.style.paddingRight = btn.style.marginLeft = px(border);
				btn.addEventListener('click', btns[i].func);
				appe(bar, btn);
			}
			appe(c, box);
			appe(c, bar);
		})
	}
	function drawBoard(){
		ctx.resetTransform();
		ctx.clearRect(0, 0, boardSize, boardSize);
		var cell = boardSize / N; var half = cell / 2;
		var lineWeight = cell / 40;

		// Draw lines
		ctx.beginPath();
		ctx.lineWidth = lineWeight.toString();
		ctx.strokeStyle = lineColor;
		for (var i = 0; i < N; i++){
			ctx.moveTo(half, cell * (i + 0.5)); ctx.lineTo(boardSize - half, cell * (i + 0.5));
			ctx.moveTo(cell * (i + 0.5), half); ctx.lineTo(cell * (i + 0.5), boardSize - half);
		}
		ctx.stroke();

		// Draw pieces
		var r = cell * 0.4;
		var grdb = ctx.createRadialGradient(r * 0.4, -r * 0.4, 0, r / 4, -r / 4, r * 0.7);
		grdb.addColorStop(0, '#CCC'), grdb.addColorStop(1, 'black');
		var grdw = ctx.createRadialGradient(r * 0.4, -r * 0.4, 0, r / 4, -r / 4, r * 0.7);
		grdw.addColorStop(0, 'white'), grdw.addColorStop(1, '#DDD');

		for (var k = 0; k < steps.length; k++){
			var i = steps[k][1], j = steps[k][0];
			ctx.resetTransform();
			ctx.translate(cell * (i + 0.5), cell * (j + 0.5));
			if (k % 2 == 0) ctx.strokeStyle = 'black', ctx.fillStyle = grdb;
			else ctx.strokeStyle = '#DDD', ctx.fillStyle = grdw;
			circle(ctx, 0, 0, r);
		}

		// Draw marks
		if (markOpposite){
			var i = markOpposite[1], j = markOpposite[0], a = cell * 0.16;
			ctx.fillStyle = moppColor;
			ctx.resetTransform();
			ctx.translate(cell * (i + 0.5), cell * (j + 0.5));
			ctx.fillRect(-a, -a, 2 * a, 2 * a);
		}

		// Draw marks
		if (markTip){
			var i = markTip[1], j = markTip[0], a = cell * 0.13;
			ctx.fillStyle = mtipColor;
			ctx.resetTransform();
			ctx.translate(cell * (i + 0.5), cell * (j + 0.5));
			ctx.fillRect(-a, -a, 2 * a, 2 * a);
		}

		// Draw marks
		if (markPointer){
			var i = markPointer[1], j = markPointer[0], a = cell * 0.1;
			ctx.fillStyle = mptColor;
			ctx.resetTransform();
			ctx.translate(cell * (i + 0.5), cell * (j + 0.5));
			ctx.fillRect(-a, -a, 2 * a, 2 * a);
		}

		var fontSize = Math.round(cell * 2 / 5);
		ctx.font =  `${fontSize}px Arial`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		if (dispSteps){
			for (var k = 0; k < steps.length; k++){
				var i = steps[k][1], j = steps[k][0];
				ctx.resetTransform();
				ctx.translate(cell * (i + 0.5), cell * (j + 0.5));
				if (k % 2 == 0) ctx.fillStyle = 'white';
				else ctx.fillStyle = 'black';
				ctx.fillText(k + 1, 0, 0);
			}
		}
	}
	initControls();
	function initControls(){
		var btnWidth = rWidth / 2;
		function adjustCtl(ctl){
			ctl.style.width = px(btnWidth);
			ctl.style.display = 'block';
			ctl.style.marginLeft = ctl.style.marginRight = 'auto';
			ctl.style.marginBottom = px(border);
			ctl.style.paddingTop = ctl.style.paddingBottom = px(3);
			ctl.style.textAlign = 'center';
		}

		// who is first
		var selbox = newe('select'), item;
		selbox.style.appearance = 'none';
		item = newe('option');
		item.value = 0; item.innerText = '我先手';
		appe(selbox, item);
		item = newe('option');
		item.value = 1; item.innerText = '我后手';
		appe(selbox, item);
		var i = nfirst ? 0 : 1;
		selbox[i].selected = true;
		adjustCtl(selbox);
		selbox.addEventListener('change', function(e){nfirst = selbox.value == 0; tryWrite('playerFirst', nfirst)});
		appe(funcbar, selbox);

		// search depth
		var difbox = newe('select');
		difbox.style.appearance = 'none';
		for (var i = 0; i < difmsg.length; i++){
			if (!difmsg[i]) continue;
			item = newe('option');
			item.value = i; item.innerText = difmsg[i];
			if (i == depth) item.selected = true;
			appe(difbox, item);
		}
		adjustCtl(difbox);
		difbox.addEventListener('change', function(e){var i = parseInt(difbox.value); if (i > 0) depth = i, tryWrite('level', i);});
		appe(funcbar, difbox);

		// buttons
		var btn;
		for (const k in btns){
			btn = newe('button');
			adjustCtl(btn);
			btn.innerText = btns[k];
			btn.addEventListener('click', buttonf(onCmd, btns[k]));
			appe(funcbar, btn);
		}
	}

	var dots = 0, timer;
	function thinkf(){
		var t = '计算机思考中';
		for (var i = 0; i <= dots; i++) t += '.';
		tips(t); dots++;
		if (dots >= 3) dots = 0;
	}
	function tipf(){
		var t = '计算中';
		for (var i = 0; i <= dots; i++) t += '.';
		tips(t); dots++;
		if (dots >= 3) dots = 0;
	}
	function check(){
		if (state == State.Prepare) return false;
		var ret = 0;
		function equals(v,a,b,c,d,e){if (a==v&&b==v&&c==v&&d==v&&e==v)return v;return 0;}
		for (var i = 0; i < N; i++){
			for (var j = 4; j < N; j++){
				for (var k = 1; k <= 2; k++){
					if (equals(k, board[i][j], board[i][j-1], board[i][j-2], board[i][j-3], board[i][j-4])) ret = k; if (ret) break;
					if (equals(k, board[j][i], board[j-1][i], board[j-2][i], board[j-3][i], board[j-4][i])) ret = k; if (ret) break;
				}
				if (ret) break;
			}
			if (ret) break;
		}
		for (var i = 4; i < N; i++){
			for (var j = 4; j < N; j++){
				for (var k = 1; k <= 2; k++){
					if (equals(k, board[i][j], board[i-1][j-1], board[i-2][j-2], board[i-3][j-3], board[i-4][j-4])) ret = k; if (ret) break;
					if (equals(k, board[i-4][j], board[i-3][j-1], board[i-2][j-2], board[i-1][j-3], board[i][j-4])) ret = k; if (ret) break;
				}
				if (ret) break;
			}
			if (ret) break;
		}
		if (ret){
			state = State.End, win = ret;
			return true;
		}else{
			var c = 0;
			for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) if (board[j][i] != 0) c++;
			if (c == N * N){
				state = State.End, win = 0;
				return true;
			}
			return false;
		}
	}
	function turn(x, y){
		switch (state){
			case State.Prepare:{
				state = first ? State.Player : State.Opposite;
				var t = Math.floor(N / 2);
				if (!first) markOpposite = [t, t];
				turn(t, t);
			}break;
			case State.Player:{
				step(x, y, 1);
				state = State.Opposite;
				if (!check()){
					if (inTip){
						workerReset();
						clearInterval(timer);
						timer = false, inTip = false;
					}
					worker.postMessage([N, board, 2, depth]);
					timer = setIntervalx(thinkf, 1000);
				}else turn();
				drawBoard();
			}break;
			case State.Opposite:{
				step(x, y, 2);
				state = State.Player;
				if (timer) clearInterval(timer), timer = false, dots = 0;
				tipsxy(x, y);
				if (check()) turn();
				drawBoard();
			}break;
			case State.End:{
				tips(endmsg[win]);
			}break;
			default: break;
		}
	}
	function backup(){
		var bk = 0; markTip = false;
		switch (state){
			case State.Player:
				bk = 2; break;
			case State.Opposite:
				workerReset();
				if (timer) clearInterval(timer), timer = false;
				state = State.Player;
				bk = 1; break;
			case State.End:
				bk = ((first ? 1 : 0) + steps.length) % 2 + 1;
				state = State.Player; break;
			default: break;
		}
		if (bk != 0){
			if (steps.length >= bk){
				while (bk--){
					var p = steps.pop();
					board[p[0]][p[1]] = 0;
				}
				if (steps.length > 0){
					var p = steps[steps.length - 1];
					markOpposite = [p[0], p[1]];
					tipsxy(p[1], p[0]);
					drawBoard();
				}else{
					state = State.Prepare;
					markOpposite = false;
					turn();
				}
			}else tips('已经是开局了');
		}
	}
	function tipPos(){
		if (state != State.Player || inTip) return;
		worker.postMessage([N, board, 1, depth]);
		timer = setIntervalx(tipf, 1000);
		inTip = true;
	}
	var dispSteps = false;
	function revOptStep(){
		dispSteps = !dispSteps;
		drawBoard();
	}
	const infoType = [
		{name: '坐标式:', func: function(steps){
			var s = '', x, y;
			for (var i = 0; i < steps.length; i++){
				x = steps[i][1], y = steps[i][0];
				if (i != 0) s += ' ';
				s += String.fromCharCode(x + 65) + (y + 1);
			}
			return s;
		}},
		{name: '数组式:', func: function(steps){
			var s = '[', x, y;
			for (var i = 0; i < steps.length; i++){
				if (i != 0) s += ', ';
				x = steps[i][1], y = steps[i][0];
				s += `[${y}, ${x}]`;
			}
			return s + ']';
		}},
		{name: '分组式:', func: function(steps){
			var s = '', t = '', x, y;
			for (var i = 0; i < steps.length; i++){
				x = steps[i][1], y = steps[i][0];
				if (i % 2 == 0){
					if (i != 0) s += ', ';
					s += `[${y}, ${x}]`;
				}else{
					if (i != 1) t += ', ';
					t += `[${y}, ${x}]`;
				}
			}
			return `[[${s}], [${t}]]`;
		}},
	];
	function infoDlg(){
		showDialogWithOkBtn(function(box, b, destroyf){
			var datainfo = `${storemsg[storage]}(${storage})`;

			newp(box, btns.info, 'h2');
			newp(box, `第 ${steps.length} 手`);
			newp(box, `先手: ${first ? '玩家' : '电脑'}`);
			newp(box, `难度: ${difmsg[depth]}(${depth})`);

			var g = newg('<h3>存储</h3>');
			var h = newe('h4');
			h.innerHTML = datainfo;
			h.style.marginTop = h.style.marginBottom = 0;
			appe(g, h);
			if (storage != 0){
				var json = tryGetJson();
				if (!json || json == '') json = '无存储的数据';
				var e = newe('p');
				e.style.maxHeight = px(size / 4);
				e.style.overflowY = 'auto';
				e.style.wordBreak = 'break-word';
				e.innerText = json;
				appe(g, e);
			}
			appe(box, g);

			g = newg('<h3>棋局信息</h3>');
			for (var i in infoType){
				var t = infoType[i];
				var h = newe('h4');
				h.innerHTML = t.name;
				h.style.marginTop = h.style.marginBottom = 0;
				appe(g, h);
				var e = newe('p');
				e.style.maxHeight = px(size / 3);
				e.style.overflowY = 'auto';
				e.style.wordBreak = 'break-word';
				e.innerText = t.func(steps);
				appe(g, e);
			}
			appe(box, g);
			b.unshift({name: '清空存储数据', func: function(){tryRemove(), destroyf(), infoDlg()}});
		})
	}
	function helpDlg(){
		showDialogWithOkBtn(function(box){

			newp(box, btns.help, 'h2');
			newp(box, helpmsg[0].msg);

			for (var i = 1; i < helpmsg.length; i++){
				var p = newe('h3');
				p.innerText = helpmsg[i].name;
				appe(box, p);
				p = newe('p');
				p.style.wordBreak = 'break-word';
				p.innerHTML = helpmsg[i].msg;
				appe(box, p);
			}
		})
	}
	function step(x, y, i){
		board[y][x] = i;
		steps.push([y, x]);
	}
	function restart(){
		workerReset(); inTip = false;
		if (timer) clearInterval(timer), timer = false;
		state = State.Prepare; first = nfirst;
		board = narr(N, function(){return narr(N, zerof)});
		markPointer = markOpposite = markTip = false;
		steps = []; turn();
	}

	if (typeof (callback) === 'function') callback(table, canvas, funcbar, tipbar);

	var board, markPointer, markOpposite, markTip, steps, first, inTip;

	restart();

	function tips(msg){tipbar.innerText = msg;}
	function tipsxy(x, y){tips(`[${y}, ${x}]`);}
	function getxy(_x, _y){
		var x = Math.floor(_x / size * N), y = Math.floor(_y / size * N);
		x = x < 0 ? 0 : (x >= N ? (N - 1) : x), y = y < 0 ? 0 : (y >= N ? (N - 1) : y);
		return [x, y];
	}
	function movemark(x, y){
		if (!markPointer || x != markPointer[1] || y != markPointer[0]){
			if (state == State.Player && !inTip) tipsxy(x, y);
			markPointer = [y, x], drawBoard();
		}
	}
	function tryturn(x, y){
		if (state == State.Player){
			if (board[y][x] != 0 && !godmode) tips('该点已经有子');
			else markTip = false, turn(x, y);
		}else if (state == State.Opposite) tips('计算机正在思考');
	}
	canvas.addEventListener('mousemove', function(e){
		var [x, y] = getxy(e.offsetX, e.offsetY);
		movemark(x, y);
		e.preventDefault();
	});
	canvas.addEventListener('click', function(e){
		var [x, y] = getxy(e.offsetX, e.offsetY);
		tryturn(x, y);
	});
	var tchX, tchY, tchmode = 0, tchrad2 = size * size / (N * N), tchx, tchy;
	function getTouchPos(touch){
		var box = canvas.getBoundingClientRect();
		return [Math.round(touch.clientX - box.x), Math.round(touch.clientY - box.y)];
	}
	var touchflag;
	canvas.addEventListener('touchstart', function(e){
		if (e.touches.length != 1) return;
		[tchX, tchY] = getTouchPos(e.touches[0]);
		tchmode = 0;
		var [x, y] = getxy(tchX, tchY);
		movemark(x, y);
		touchflag = true;
	});
	canvas.addEventListener('touchmove', function(e){
		if (e.touches.length != 1 || !touchflag){touchflag = false; return;}
		var [px, py] = getTouchPos(e.touches[0]);
		if (tchmode == 0){
			var ox = px - tchX, oy = py - tchY;
			if (ox * ox + oy * oy >= tchrad2 * 3){
				tchmode = 1;
				tchx = Math.round(Math.sqrt(tchrad2 * 20) * 3 / 5), tchy = Math.round(Math.sqrt(tchrad2 * 20) * 4 / 5);
			}
		}else{
			var ox = px - tchx, oy = py - tchy;
			if (px < 0 || py < 0 || ox >= size || oy >= size){
				markPointer = false;
				drawBoard();
			}else{
				var [x, y] = getxy(ox, oy);
				movemark(x, y);
			}
		}
		e.preventDefault();
	});
	canvas.addEventListener('touchend', function(e){
		if (markPointer) tryturn(markPointer[1], markPointer[0]);
		e.preventDefault();
	});
	table.addEventListener('keydown', function(e){
		if (markPointer && !inUI && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey){
			var delta, handle = true;
			switch (e.key){
				case 'ArrowLeft': case 'a': delta = [0, -1]; break;
				case 'ArrowRight': case 'd': delta = [0, 1]; break;
				case 'ArrowUp': case 'w': delta = [-1, 0]; break;
				case 'ArrowDown': case 's': delta = [1, 0]; break;
				case 'Enter': case ' ': tryturn(markPointer[1], markPointer[0]); break;
				case 'q': backup(); break;
				default: handle = false; break;
			}
			if (delta){
				var [y, x] = markPointer;
				y += delta[0], x += delta[1];
				y = y < 0 ? 0 : (y >= N ? (N - 1) : y), x = x < 0 ? 0 : (x >= N ? ( N - 1) : x);
				markPointer = [y, x];
				if (state == State.Player && !inTip) tipsxy(x, y);
				drawBoard();
			}
			if (handle) e.preventDefault();
		}
	});
	function onCmd(id){
		switch (id){
			case btns.backup: backup(); break;
			case btns.reset: restart(); break;
			case btns.tips: tipPos(); break;
			case btns.dispstep: revOptStep(); break;
			case btns.info: infoDlg(); break;
			case btns.help: helpDlg(); break;
		}
	}
}
