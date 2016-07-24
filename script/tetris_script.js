/**
 * AUTHOR - ME
 */

/*					расширения для Array				*/

Array.prototype.last = function() {
	return this[this.length - 1];
}
Array.prototype.first = function() {
	return this[0];
}
Array.prototype.isEmpty = function() {
	return !(this.length > 0);
}

/*					расширения для Context2D			*/

CanvasRenderingContext2D.prototype.fillRoundedRect = function (x, y, w, h, r) {
	this.beginPath();
	this.moveTo(x+r, y);
	this.lineTo(x+w-r, y);
	this.quadraticCurveTo(x+w, y, x+w, y+r);
	this.lineTo(x+w, y+h-r);
	this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
	this.lineTo(x+r, y+h);
	this.quadraticCurveTo(x, y+h, x, y+h-r);
	this.lineTo(x, y+r);
	this.quadraticCurveTo(x, y, x+r, y);
	this.fill();
}
CanvasRenderingContext2D.prototype.drawEllipse = function (x, y, a, b) {
  // Запоминаем положение системы координат (CК) и масштаб
  this.save();
  this.beginPath();
 
  // Переносим СК в центр будущего эллипса
  this.translate(x, y);
 
  /*
   * Масштабируем по х.
   * Теперь нарисованная окружность вытянется в a / b раз
   * и станет эллипсом
   */
 
  this.scale(a / b, 1);
 
  // Рисуем окружность, которая благодаря масштабированию станет эллипсом
  this.arc(0, 0, b, 0, Math.PI * 2, true);
 
  // Восстанавливаем СК и масштаб
  this.restore();
 
  this.closePath();
}

/*							код							*/

window.onload = initCanvas;
window.onkeydown = keyEvent;

var canvas;
var cntx;

var gameSpeed 			= 700;
var gameLevelCost 		= 1000;
var gameLevelSpeedStep 	= 100;
var lineFillCost 		= 100;
var gameLevel 			= 0;
var gameState 			= 'game';
var gameField;

function keyEvent(e) {
	var code = e.keyCode;
	
	if ((code >= 37) && (code <= 40)) {
		if (gameState != 'game') return;
		
		if (code == 40) gameField.moveBlockDown();
		else if (code == 38) gameField.rotateBlockRight();
		else if (code == 37) gameField.moveBlockLeft();
		else if (code == 39) gameField.moveBlockRight();
		
		redrawGameField();
	}
}

function initCanvas() {
	canvas = document.getElementById("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	cntx = canvas.getContext('2d');

	main();
}

function main() {
	gameField = new GameField(10,15);

	redrawGameField();
	setTimeout(updateField, gameSpeed);
}
function updateField() {
	gameField.moveActiveBlock();
	
	//	проверка смены уровня
	if ( Math.floor(gameField.cost / gameLevelCost) > gameLevel)
		levelUp();
	
	redrawGameField();

	if (gameState == 'gameover') {
		gameField.drawEndGameLogo();
	}
	else {
		setTimeout(updateField, gameSpeed);
	}
}
function redrawGameField() {
	clear();
	gameField.draw();
}
function clear() {
	cntx.clearRect(0, 0, canvas.width, canvas.height);
	cntx.fillStyle = 'rgba(36, 36, 36, 1)';
	cntx.fillRect(0, 0, canvas.width, canvas.height);
}

function levelUp() {
	gameLevel++;
	gameSpeed -= gameLevelSpeedStep;
	gameField.changeStyle();
	console.log(gameLevel);
}

function Point(x, y) {
	this.x = x || 0;
	this.y = y || 0;

	this.isEqual = function(pt) {
		if (pt == undefined) return false;
		if ((this.x == pt.x) && (this.y == pt.y)) return true;
		else return false;
	}
	
	this.add = function(pt) {
		return new Point(this.x+pt.x, this.y+pt.y);
	}
	this.addCoord = function(x, y) {
		return new Point(this.x+x, this.y+y);
	}
	this.mul = function(scaleX, scaleY) {
		return new Point(this.x*scaleX, this.y*scaleY);
	}
}

function GameField(width, height) {
	var self = this;
	this.cellWidth = 20;
	this.previewCellWidth = 15;
	this.padding = 20;
	this.WCountCell = width;
	this.HCountCell = height;
	this.width = self.cellWidth*width;
	this.height = self.cellWidth*height;
	this.location = new Point(canvas.width/2-self.width/2, canvas.height/2-self.height/2);
	this.backClr	= 'rgba(250, 250, 250, 1)';
	this.borderClr	= 'rgba(250, 250, 250, 1)';
	this.gridClr	= 'rgba(36, 36, 36, 1)';
	this.blockClr	= 'rgba(255, 128, 0, 1)';
	this.costTextClr = 'rgba(250, 250, 250, 1)';
	
	this.costTextPt  = new Point(self.location.x + self.width + self.padding*2, self.location.y + 20);
	this.nextBlockPt = new Point(self.location.x + self.width + self.padding*2 + 5, self.location.y + 50)
	
	this.cost = 0;
	
	this.bricks = [];
	this.activeBlock;
	this.nextBlock;
	this.blockAppearPt = new Point(4, 0);
	
	this.styles = [
					'rgba( 255, 128,   0, 1 )',
					'rgba(  29, 201,  29, 1 )', //	green
					'rgba(   0, 162, 232, 1 )', //	light blue
					'rgba(  24,  44, 216, 1 )', //	blue
					'rgba( 173,  80, 255, 1 )', //	violet
					'rgba( 252,  15, 192, 1 )', //	pink
					'rgba( 220,  32,  45, 1 )'  //	red
				];
	
	this.cellIsEmpty = function(pt) {
		if ((pt.x < 0) || (pt.x >= self.WCountCell) || (pt.y < 0) || (pt.y > self.HCountCell)) return true;
		if (self.bricks[pt.x][pt.y] == 1) return false;
		
		return true;
	}
	this.outOfField = function(pt) {
		if ((pt.x < 0) || (pt.x >= self.WCountCell) || ((pt.y+1) < 0) || ((pt.y+1) >= self.HCountCell)) {
			return true;
		}
		
		return false;
	}
	this.outOfFloor = function(pt) {
		if (pt.y >= self.HCountCell) {
			return true;
		}
		
		return false;
	}
	
	this.blockPosConflict = function() {
		for (var i=0, count=self.activeBlock.bricks.length; i<count; i++) {
			var brickPt = self.activeBlock.brickLocation(i);
			if ((self.outOfField(brickPt)) || (self.bricks[brickPt.x][brickPt.y] == 1))
				return true;
		}
		
		return false;
	}
	
	this.canMoveDown = function() {
		var activeBlock = self.activeBlock;		
		for (var i=0, brCount=activeBlock.bricks.length; i<brCount; i++) {
			var underBrickPt = activeBlock.brickLocation(i).addCoord(0, 1);
			//	добрались до дна или клетка под нами занята
			if ((self.outOfFloor(underBrickPt)) || (!self.cellIsEmpty(underBrickPt))) {
				return false;
			}
		}
		
		return true;
	}
	
	this.getRndBlock = function() {
		var rnd = Math.round(Math.random()*6);
		var startPt = new Point(self.blockAppearPt.x, self.blockAppearPt.y);
		var rndBlock;
		
		if (rnd == 0) rndBlock = new BlockJ(startPt);
		else if (rnd == 1) rndBlock = new BlockL(startPt);
		else if (rnd == 2) rndBlock = new BlockT(startPt);
		else if (rnd == 3) rndBlock = new BlockI(startPt);
		else if (rnd == 4) rndBlock = new BlockQ(startPt);
		else if (rnd == 5) rndBlock = new BlockS(startPt);
		else if (rnd == 6) rndBlock = new BlockZ(startPt);
		
		return rndBlock;
	}
	
	this.createActiveBlock = function() {
		self.activeBlock = new BlockL(new Point(self.blockAppearPt.x, self.blockAppearPt.y));
	}
	this.createRndActiveBlock = function() {
		// var rnd = Math.round(Math.random()*6);
		// var startPt = new Point(self.blockAppearPt.x, self.blockAppearPt.y);
		
		
		// if (rnd == 0) self.activeBlock = new BlockJ(startPt);
		// else if (rnd == 1) self.activeBlock = new BlockL(startPt);
		// else if (rnd == 2) self.activeBlock = new BlockT(startPt);
		// else if (rnd == 3) self.activeBlock = new BlockI(startPt);
		// else if (rnd == 4) self.activeBlock = new BlockQ(startPt);
		// else if (rnd == 5) self.activeBlock = new BlockS(startPt);
		// else if (rnd == 6) self.activeBlock = new BlockZ(startPt);
		
		self.activeBlock = self.getRndBlock();
		// return rnd;
	}
	
	this.rotateBlockLeft = function() {
		self.activeBlock.rotateLeft();
	}
	this.rotateBlockRight = function() {
		self.activeBlock.rotateRight();
		
		//	проверяем на столкновение
		if ( self.blockPosConflict() ) {
			self.rotateBlockLeft();
		}
		
		// 1. повернуть
		// 2. проверить на коллизию со стенками и ячейками поля
		// 		2.1 все в порядке
		//		2.2 сдвинуть в сторону и проверить на коллизию еще раз
	}
	this.moveBlockLeft = function() {
		var activeBlock = self.activeBlock;
		for (var i=0, brCount=activeBlock.bricks.length; i<brCount; i++) {
			var brickPt = activeBlock.brickLocation(i);
			if (brickPt.x == 0) return false;
			if (!self.cellIsEmpty(brickPt.addCoord(-1,0))) return false;
		}
		
		activeBlock.location.x--;
	}
	this.moveBlockRight = function() {
		var activeBlock = self.activeBlock;
		for (var i=0, brCount=activeBlock.bricks.length; i<brCount; i++) {
			var brickPt = activeBlock.brickLocation(i);
			if (brickPt.x == (self.WCountCell-1)) return false;
			if (!self.cellIsEmpty(brickPt.addCoord(1,0))) return false;
		}
		
		activeBlock.location.x++;
	}
	this.moveBlockDown = function() {
		if (self.canMoveDown()) {
			self.activeBlock.location.y++;
		}
	}
	
	this.clientPtCoord = function(x, y) {
		return new Point(self.location.x + x, self.location.y + y);
	}
	this.clientPt = function(pt) {
		return new Point(self.location.x + pt.x, self.location.y + pt.y);
	}
	
	this.addBricks = function(arr) {
		for (var i=0, l=arr.length; i<l; i++) {
			var brickX = self.activeBlock.location.x + arr[i].location.x;
			var brickY = self.activeBlock.location.y + arr[i].location.y;
			self.bricks[brickX][brickY] = 1;
		}
	}
	this.removeLine = function(index) {
		for (var x=0; x<self.WCountCell; x++) {
			self.bricks[x][index] = 0;
		}
	}
	this.checkFillLine = function() {
		var filledLines = [];
		var filled;
		
		//	ищем заполненные линии
		for (var y=0; y<self.HCountCell; y++) {
			filled = true;
			for (var x=0; x<self.WCountCell; x++) {
				//	есть пустая ячейка -> линия не заполнена
				if (self.bricks[x][y] == 0) {
					filled = false;
					break;
				}
			}
			
			if (filled) filledLines.push(y);
		}
		
		//	удаляем заполненные линии
		for (var i=0; i<filledLines.length; i++) {
			var lineIndex = filledLines[i];
			self.removeLine(lineIndex);
			self.cost += lineFillCost;
		
			//	сдвигаем остальные полосы вниз
			for (var y=lineIndex; y>0; y--) {
				for (var x=0; x<self.WCountCell; x++) {
					self.bricks[x][y] = self.bricks[x][y-1];
				}
			}
		}
		
		if (filledLines.length > 0) return true;
		else return false;
	}
	
	this.moveActiveBlock = function() {
		var activeBlock = self.activeBlock;
		if (self.activeBlock == undefined) return;
		
		var canMove = self.canMoveDown();
		
		if (canMove) {
			activeBlock.location.y++;
		}
		else {
			//	переписываем бриксы в массив поля
			self.addBricks(activeBlock.bricks);
			//	проверяем заполненные линии
			var lineFilled = self.checkFillLine();
			
			//	место кончилось
			if ((!lineFilled) && (activeBlock.location.y == self.blockAppearPt.y)) {
				gameState = 'gameover';
			}
			else {
				//	пускаем новый блок
				self.activeBlock = self.nextBlock;
				self.nextBlock = self.getRndBlock();
			}
		}
	}
	
	this.changeStyle = function() {
		var styleIndex = gameLevel;
		if (styleIndex >= self.styles.length) styleIndex = self.styles.length-1;
		
		self.blockClr = self.styles[styleIndex];
	}
	
	this.draw = function() {
		var fieldPos = self.location;
		
		//	фон
		cntx.beginPath();
		cntx.fillStyle = self.backClr;
		cntx.rect(fieldPos.x, fieldPos.y, self.width, self.height);
		cntx.fill();
		
		//	активный блок
		var activeBlock = self.activeBlock;
		if (activeBlock != undefined) {
			for (var i=0, brCount=activeBlock.bricks.length; i<brCount; i++) {
				var brickPt = self.clientPt(activeBlock.brickLocation(i).mul(self.cellWidth, self.cellWidth));
				cntx.fillStyle = self.blockClr;
				cntx.fillRect(brickPt.x, brickPt.y, self.cellWidth, self.cellWidth);
			}
		}
		
		//	массив Bricks
		for (var x=0; x<self.WCountCell; x++) {
			for (var y=0; y<self.HCountCell; y++) {
				if (self.bricks[x][y] == 1) {
					var brickPt = self.clientPtCoord(x*self.cellWidth, y*self.cellWidth);
					cntx.fillStyle = self.blockClr;
					cntx.fillRect( brickPt.x, brickPt.y, self.cellWidth, self.cellWidth);
				}
			}
		}
		
		//	границы дорожек
		for (var x=1; x<self.WCountCell; x++) {
			var gridXPt = self.clientPtCoord(x*self.cellWidth, 0);
			cntx.beginPath();
			cntx.lineWidth = 1;
			cntx.strokeStyle = self.gridClr;
			cntx.moveTo(gridXPt.x, gridXPt.y);
			cntx.lineTo(gridXPt.x, gridXPt.y + self.height);
			cntx.stroke();
		}
		for (var y=1; y<self.HCountCell; y++) {
			var gridYPt = self.clientPtCoord(0, y*self.cellWidth);
			cntx.beginPath();
			cntx.lineWidth = 1;
			cntx.strokeStyle = self.gridClr;
			cntx.moveTo(gridYPt.x, gridYPt.y);
			cntx.lineTo(gridYPt.x + self.width, gridYPt.y);
			cntx.stroke();
		}
		
		//	рамка поля
		var borderPt = self.clientPtCoord(-self.padding, -self.padding);
		cntx.beginPath();
		cntx.lineWidth = 1;
		cntx.strokeStyle = self.borderClr;
		cntx.rect(borderPt.x, borderPt.y, self.width + self.padding*2, self.height + self.padding*2);
		cntx.stroke();
		
		//	очки
		cntx.textAlign = 'left';
		cntx.textBaseline = 'middle';
		cntx.font = 'bold 22pt IrisUPC';
		cntx.fillStyle = self.costTextClr;
		cntx.fillText(self.cost, self.costTextPt.x, self.costTextPt.y);
		
		//	следующий блок
		var nextBlock = self.nextBlock;
		if (nextBlock != undefined) {
			for (var i=0, brCount=nextBlock.bricks.length; i<brCount; i++) {
				var brickPt = nextBlock.bricks[i].location.mul(self.previewCellWidth, self.previewCellWidth);
				brickPt = brickPt.add(self.nextBlockPt);
				cntx.fillStyle = self.blockClr;
				cntx.fillRect(brickPt.x, brickPt.y, self.previewCellWidth, self.previewCellWidth);
				cntx.strokeStyle = self.borderClr;
				cntx.strokeRect(brickPt.x, brickPt.y, self.previewCellWidth, self.previewCellWidth);
			}
		}
	}
	this.drawEndGameLogo = function() {
		cntx.textAlign = 'center';
		cntx.textBaseline = 'middle';

		cntx.beginPath();
		cntx.lineWidth = 2;
		cntx.font = 'bold 22pt IrisUPC';
		cntx.strokeStyle = 'rgba(250, 250, 250, 1)';
		cntx.strokeText("GAME OVER", canvas.width/2, canvas.height/2);
		cntx.stroke();

		cntx.font = 'bold 22pt IrisUPC';
		cntx.fillStyle = 'rgba(36, 36, 36, 1)';
		cntx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
	}
	
	this.init = function() {
		//	все ячейки поля пустые
		for	(var xb=0; xb<self.WCountCell; xb++) {
			self.bricks[xb] = [];
			for	(var yb=0; yb<self.HCountCell; yb++) {
				self.bricks[xb][yb] = 0;
			}
		}
	
		self.createRndActiveBlock();
		self.nextBlock = self.getRndBlock();
	}
	
	self.init();
}

/*							блоки							*/

function Block() {
	var self = this;
	this.location;
	this.center;
	this.bricks = [];
	
	this.rotate = function(angle) {
		var center = self.center;
		for (var i=0, count=self.bricks.length; i<count; i++) {
			var pt = self.bricks[i].location;
			var nx = Math.round( center.x + (pt.x-center.x)*Math.cos(angle) - (pt.y-center.y)*Math.sin(angle) );
			var ny = Math.round( center.y + (pt.y-center.y)*Math.cos(angle) + (pt.x-center.x)*Math.sin(angle) );
			self.bricks[i].location = new Point(nx, ny);
		}
	}
	
	this.rotateLeft = function() {
		self.rotate(Math.PI/2);
	}
	this.rotateRight = function() {
		self.rotate(-Math.PI/2);
	}

	this.brickLocation = function(index) {
		if (self.bricks[index] == undefined) return false;
		
		var brPt = self.bricks[index].location;
		var blPt = self.location;
		return blPt.add(brPt);
	}
}

function BlockJ(pt) {
	var	block = new Block();
	
	block.location = pt;
	block.center = new Point(1, 1);
	
	block.bricks.push(new Brick(1, 0));
	block.bricks.push(new Brick(1, 1));
	block.bricks.push(new Brick(1, 2));
	block.bricks.push(new Brick(0, 2));
	
	return block;
}
function BlockL(pt) {
	var	block = new Block();
	
	block.location = pt;
	block.center = new Point(0, 1);
	
	block.bricks.push(new Brick(0, 0));
	block.bricks.push(new Brick(0, 1));
	block.bricks.push(new Brick(0, 2));
	block.bricks.push(new Brick(1, 2));
	
	return block;
}
function BlockT(pt) {
	var	block = new Block();
	
	block.location = pt;
	block.center = new Point(1, 1);
	
	block.bricks.push(new Brick(0, 0));
	block.bricks.push(new Brick(1, 0));
	block.bricks.push(new Brick(2, 0));
	block.bricks.push(new Brick(1, 1));
	
	return block;
}
function BlockI(pt) {
	var	block = new Block();
	
	block.location = pt;
	block.center = new Point(1, 0);
	block.rotated = false;
	
	block.bricks.push(new Brick(0, 0));
	block.bricks.push(new Brick(1, 0));
	block.bricks.push(new Brick(2, 0));
	block.bricks.push(new Brick(3, 0));
	
	block.rotateRight = function() { 
		if (this.rotated) this.rotate(-Math.PI/2);
		else this.rotate(Math.PI/2);;
		this.rotated = !this.rotated;
	}
	
	return block;
}
function BlockQ(pt) {
	var	block = new Block();
	
	block.location = pt;
	block.center = new Point(0, 1);
	
	block.bricks.push(new Brick(0, 0));
	block.bricks.push(new Brick(0, 1));
	block.bricks.push(new Brick(1, 0));
	block.bricks.push(new Brick(1, 1));
	
	block.rotate = function() { return true; }
	
	return block;
}
function BlockS(pt) {
	var	block = new Block();
	
	block.location = pt;
	block.center = new Point(1, 1);
	
	block.bricks.push(new Brick(2, 0));
	block.bricks.push(new Brick(1, 0));
	block.bricks.push(new Brick(1, 1));
	block.bricks.push(new Brick(0, 1));
	
	return block;
}
function BlockZ(pt) {
	var	block = new Block();
	
	block.location = pt;
	block.center = new Point(1, 1);
	
	block.bricks.push(new Brick(0, 0));
	block.bricks.push(new Brick(1, 0));
	block.bricks.push(new Brick(1, 1));
	block.bricks.push(new Brick(2, 1));
	
	return block;
}

function Brick(x, y) {
	this.location = new Point(x, y);
}

