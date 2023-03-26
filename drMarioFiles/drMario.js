"use strict";
let game = {
	capsule: [],
	nextCapsule: [],
	colors: ["blue", "red", "yellow"],
	realGameBoard: null,
	divGame: null,
	throwTable: null,
	interval: null,
	covidInterval: null,
	id: 0,
	stopAnyInput: false,
	covidNumber: 4,
	startNewGame()
	{
		this.nextCapsule = [
			{x: 0, y: Math.floor(GAME_BOARD_WIDTH / 2) - 1, color: this.colors.randomElement(), id: this.id},
			{x: 0, y: Math.floor(GAME_BOARD_WIDTH / 2), color: this.colors.randomElement(), id: this.id++}
		];
		localStorage.score = "0";
		if(localStorage.top === undefined)
			localStorage.top = "0";
		this.generateGameBoard();
		this.generateSmallCovids();
		this.generateBigCovids();
		this.generateHands();
		this.setDisplay(localStorage.top, "top");
		this.setDisplay(localStorage.score, "score");
		this.setDisplay(this.covidNumber.toString(), "covid");
		this.setKeyboardEvents();
		this.generateNewCapsule();
	},
	intervalStart()
	{
		return setInterval(() => {
			this.moveCapsule("down", true);
		}, 600);
	},
	generateNewCapsule()
	{
		clearInterval(this.interval);
		if(!this.covidNumber)
			this.stageOver("stageCompleted");
		else
		{
			this.removeWillFallFromGameBoard();
			this.capsule = this.nextCapsule;
			this.nextCapsule = [
				{x: 0, y: Math.floor(GAME_BOARD_WIDTH / 2) - 1, color: this.colors.randomElement(), id: this.id},
				{x: 0, y: Math.floor(GAME_BOARD_WIDTH / 2), color: this.colors.randomElement(), id: this.id++}
			];
			this.throwAnimation();
		}
	},
	moveCapsule(direction, isItInterval = false)
	{
		if([this.capsule[0], this.capsule[1]].includes(undefined))
		{
			this.stopAnyInput = false;
			return;
		}
		
		let xShift = new Array(2).fill(0),
			yShift = [0, 0];
		if(direction === "down")
		{
			if([this.capsule[0].x + 1, this.capsule[1].x + 1].includes(GAME_BOARD_HEIGHT))
				[xShift[0], xShift[1], yShift[0], yShift[1]] = [...new Array(4).fill(-Infinity)];
			else if(this.capsule[0].x === this.capsule[1].x)
				[xShift[0], xShift[1], yShift[0], yShift[1]] = [1, 1, 0, 0];
			else if(this.capsule[0].x > this.capsule[1].x)
				[xShift[0], xShift[1], yShift[0], yShift[1]] = [1, 0, 0, Infinity];
		}
		else if(direction === "right")
		{
			if([this.capsule[0].y + 1, this.capsule[1].y + 1].includes(GAME_BOARD_WIDTH))
				[xShift[0], xShift[1], yShift[0], yShift[1]] = [...new Array(4).fill(Infinity)];
			else if(this.capsule[0].y === this.capsule[1].y)
				[xShift[0], xShift[1], yShift[0], yShift[1]] = [0, 0, 1, 1];
			else
				[xShift[0], xShift[1], yShift[0], yShift[1]] = [Infinity, 0, 0, 1];
		}
		else if(direction === "left")
		{
			if([this.capsule[0].y - 1, this.capsule[1].y - 1].includes(-1))
				[xShift[0], xShift[1], yShift[0], yShift[1]] = [...new Array(4).fill(Infinity)];
			else if(this.capsule[0].y === this.capsule[1].y)
				[xShift[0], xShift[1], yShift[0], yShift[1]] = [0, 0, -1, -1];
			else
				[xShift[0], xShift[1], yShift[0], yShift[1]] = [0, Infinity, -1, 0];
			
		}
		if(!this.isTdBlank(this.capsule[0].x + xShift[0], this.capsule[0].y + yShift[0])
			|| !this.isTdBlank(this.capsule[1].x + xShift[1], this.capsule[1].y + yShift[1]))
		{
			if(direction === "down")
			{
				let keepPlayin = true;
				for(const cap of this.capsule)
				{
					if(cap.x === 0 && [Math.floor(GAME_BOARD_WIDTH / 2) - 1, Math.floor(GAME_BOARD_WIDTH / 2)].includes(cap.y))
					{
						keepPlayin = false;
						this.stageOver("gameOver");
					}
				}
				if(keepPlayin)
					this.sweepGameBoard();
			}
		}
		else
		{
			this.removeCapsuleFromGameBoard();
			
			if(yShift.includes(-1) || yShift.includes(1))
				for(let cap of this.capsule)
					cap.y += yShift.includes(-1) ? -1 : 1;
			if(xShift.includes(-1) || xShift.includes(1))
				for(let cap of this.capsule)
					cap.x += yShift.includes(-1) ? -1 : 1;
			
			this.putCapsuleOnGameBoard();
			if(direction === "down" && !isItInterval)
			{
				clearInterval(this.interval);
				this.stopAnyInput = true;
				setTimeout(() => this.moveCapsule("down"), 30);
			}
			else
			{
				this.stopAnyInput = false;
			}
		}
	},
	rotateCapsule(direction)
	{
		if(this.capsule[0].x !== 0)
		{
			if(this.capsule[0].y === GAME_BOARD_WIDTH - 1)
			{
				for(const cap of this.capsule)
				{
					this.moveTd(cap.x, cap.y, cap.x, cap.y - 1);
					cap.y -= 1;
				}
			}
			if(this.getCapsuleDirection() === "horizontal")
			{
				if(direction === "left")
					this.rotateCapsuleDonkeyWork(false, -1);
				if(direction === "right")
					this.rotateCapsuleDonkeyWork(true, -1);
			}
			else
			{
				if(direction === "left")
					this.rotateCapsuleDonkeyWork(true, 1);
				else if(direction === "right")
					this.rotateCapsuleDonkeyWork(false, 1);
			}
		}
	},
	rotateCapsuleDonkeyWork(colorChange, swipe)
	{
		let x = this.capsule[1].x + swipe,
			y = this.capsule[1].y + swipe;
		if(this.areThoseWithinGameBoard(x, y) && this.isTdBlank(x, y))
		{
			this.makeTdBlank(this.capsule[1].x, this.capsule[1].y);
			this.makeTdBlank(this.capsule[0].x, this.capsule[0].y);
			this.capsule[1].x = x;
			this.capsule[1].y = y;
			if(colorChange)
				[this.capsule[0].color, this.capsule[1].color] = [this.capsule[1].color, this.capsule[0].color];
			this.putCapsuleOnGameBoard();
			
		}
	},
	sweepGameBoard()
	{
		clearInterval(this.interval);
		this.stopAnyInput = true;
		let toBeSwept = [],
			toBeSweptTemp = [],
			swipes = [];
		if(this.getCapsuleDirection() === "horizontal")
			swipes = [
				"vertical",
				"vertical",
				"horizontal",
				"horizontal"
			];
		else
			swipes = [
				"horizontal",
				"horizontal",
				"vertical",
				"vertical"
			];
		
		for(let i = 0; i < 3; i++)
		{
			if(i < 2)
				toBeSweptTemp = this.checkForSweep(i % 2, swipes[i]);
			else
				toBeSweptTemp = this.checkForSweep(0, swipes[i]).concat(
					this.checkForSweep(1, swipes[i]));
			
			toBeSwept.push(...toBeSweptTemp);
			toBeSweptTemp = [];
		}
		
		if(toBeSwept.deleteSameObjects().length >= 4)
			this.sweepWhatShouldBeSwept(toBeSwept);
		else
			this.generateNewCapsule();
	},
	checkForSweep(from, direction, badge = {})
	{
		let toBeSwept = [], xSwipe = [], ySwipe = [], x, y, color;
		
		if(badge.isEmpty())
			[x, y, color] = [this.capsule[from].x, this.capsule[from].y, this.capsule[from].color];
		else
			[x, y, color] = [badge.x, badge.y, badge.color];
		
		if(color === "")
			color = ":)";
		
		if(direction === "horizontal")
			[xSwipe, ySwipe] = [[0, 0], [-1, 1]];
		else
			[xSwipe, ySwipe] = [[-1, 1], [0, 0]];
		
		for(let i = 0; i < xSwipe.length; i++)
		{
			let xT = x, yT = y;
			while(this.areThoseWithinGameBoard(xT, yT) && this.getTdColor(xT, yT)[0] === color[0])
			{
				toBeSwept.push({x: xT, y: yT});
				yT += ySwipe[i];
				xT += xSwipe[i];
			}
		}
		
		return toBeSwept.deleteSameObjects().length < 4 ? [] : toBeSwept;
	},
	checkWholeGameBoardForSweepes()
	{
		clearInterval(this.interval);
		this.stopAnyInput = true;
		let swipes = [
			"vertical",
			"horizontal"
		], toBeSwept = [];
		for(const swipe of swipes)
		{
			for(let i = 0; i < GAME_BOARD_HEIGHT; i++)
			{
				for(let j = 0; j < GAME_BOARD_WIDTH; j++)
				{
					if(!this.isTdEmpty(i, j))
						toBeSwept = toBeSwept.concat(this.checkForSweep(0, swipe, {
							x: i, y: j, color: this.getTdColor(i, j)
						}));
				}
			}
		}
		if(toBeSwept.deleteSameObjects().length >= 4)
		{
			this.sweepWhatShouldBeSwept(toBeSwept);
		}
		else
		{
			if(!this.covidNumber)
				this.stageOver("stageCompleted");
			else
				this.generateNewCapsule();
		}
	},
	sweepWhatShouldBeSwept(toBeSwept)
	{
		let i = 0,
			timeout = delay => setTimeout(() => {
				for(let td of toBeSwept)
				{
					if(i === 0)
					{
						if(this.isItCovid(td.x, td.y))
						{
							this.covidNumber--;
							localStorage.score = (parseInt(localStorage.score) + 100).toString();
							this.setDisplay(localStorage.score, "score");
							this.setDisplay(this.covidNumber.toString(), "covid");
							if(!this.covidNumber)
							{
								if(parseInt(localStorage.score) > parseInt(localStorage.top))
									localStorage.top = localStorage.score;
							}
							this.makeTdColorful(td.x, td.y, this.getTd(td.x, td.y).className[0], 0, 'x');
						}
						this.makeTdColorful(td.x, td.y, this.getTd(td.x, td.y).className[0], 0, 'o');
					}
					else if(i === 1)
						this.makeTdBlank(td.x, td.y);
					else if(i === 2)
					{
						i++;
						this.afterSweepWhatShouldBeSwept();
						return;
					}
					if([0, 1].includes(i))
						timeout(100);
				}
				i++;
			}, delay);
		timeout(0);
	},
	afterSweepWhatShouldBeSwept()
	{
		this.makeDots();
		this.removeWillFallFromGameBoard();
		
		let toFall = this.getWhatShouldFall();
		
		if(toFall.length)
		{
			this.removeWillFallFromGameBoard();
			this.makeDots();
			this.sweepWhatShouldBeSweptDonkeyWork(toFall);
		}
		else
			this.generateNewCapsule();
	},
	getWhatShouldFall()
	{
		let toFall = [];
		for(let x = GAME_BOARD_HEIGHT - 2; x >= 0; x--)
		{
			for(let y = 0; y < GAME_BOARD_WIDTH; y++)
			{
				if(!this.isTdBlank(x, y) && this.getWillFall(x, y) === undefined && !this.isItCovid(x, y))
				{
					let thisWillFall = this.canTdFall(x, y);
					for(let td of thisWillFall[1])
						this.getTd(td.x, td.y).dataset.willFall = thisWillFall[0][0].toString();
					if(thisWillFall[0][0])
						toFall.push(thisWillFall[1]);
				}
			}
		}
		return toFall;
	},
	canTdFall(x, y, checkForSecondPart = true)
	{
		if(!this.isTdEmpty(x + 1, y))
			return [[false], [{x: x, y: y}]];
		
		let secondPart = checkForSecondPart ? this.isItPartOfCapsule(x, y) : {};
		if(!secondPart.isEmpty())
		{
			if(secondPart.y === y || this.canTdFall(secondPart.x, secondPart.y, false)[0][0] === true)
				return [[true], [{x: x, y: y}, {x: secondPart.x, y: secondPart.y}]];
			else
				return [[false], [{x: x, y: y}, {x: secondPart.x, y: secondPart.y}]];
		}
		else
			return [[true], [{x: x, y: y}]];
	},
	isItPartOfCapsule(x, y)
	{
		for(let i = -1, ySwipe = 0, xSwipe = 0; i > -8; i = -Math.sign(i) * (Math.abs(i) + 2), xSwipe = ySwipe = 0)
		{
			i.isInRange(-1, 3, 'lr') ? xSwipe = i % 2 : ySwipe = i % 2;
			if(!(x + xSwipe).isInRange(0, GAME_BOARD_HEIGHT, 'l')
				|| !(y + ySwipe).isInRange(0, GAME_BOARD_WIDTH, 'l'))
				continue;
			
			if(this.getId(x + xSwipe, y + ySwipe) === this.getId(x, y))
				return {x: x + xSwipe, y: y + ySwipe};
		}
		return {};
	},
	sweepWhatShouldBeSweptDonkeyWork(toFall)
	{
		let toFallChecks = new Array(toFall.length).fill(true);
		let i = 1, j = 0;
		
		toFall.sort((a, b) => this.max(b[0].x, b[1]?.x) - this.max(a[0].x, a[1]?.x));
		for(const tds of toFall)
			tds.sort((a, b) => this.max(b.x, b?.x) - this.max(a.x, a?.x));
		let timeout = delay => setTimeout(() => {
			toFall.forEach((tds, index) => {
				if(toFallChecks[index])
				{
					if(tds.length === 2 && (this.isTdEmpty(tds[0].x + i, tds[0].y)
						&& (tds[0].y === tds[1].y || this.isTdEmpty(tds[1].x + i, tds[1].y))))
					{
						this.moveTd(tds[0].x + j, tds[0].y, tds[0].x + i, tds[0].y);
						this.moveTd(tds[1].x + j, tds[1].y, tds[1].x + i, tds[1].y);
					}
					else if(tds.length === 1 && this.isTdEmpty(tds[0].x + i, tds[0].y))
						this.moveTd(tds[0].x + j, tds[0].y, tds[0].x + i, tds[0].y);
					else
						toFallChecks[index] = false;
				}
			});
			i += 1;
			j += 1;
			if(!toFallChecks.every(bool => !bool))
				timeout(70);
			else
			{
				this.removeWillFallFromGameBoard();
				this.checkWholeGameBoardForSweepes();
			}
		}, delay);
		timeout(0);
	},
	throwAnimation()
	{
		let i = 0, gameBoard = this.gameBoard;
		this.gameBoard = this.throwTable;
		this.makeTdColorful(animation[i].x[0], animation[i].y[0], this.capsule[0].color, 0, animation[i].rotation[0]);
		this.makeTdColorful(animation[i].x[1], animation[i].y[1], this.capsule[1].color, 0, animation[i].rotation[1]);
		i++;
		let timeout = delay => setTimeout(() => {
			if(i === animation.length)
			{
				this.makeTdBlank(animation[--i].x[0], animation[i].y[0]);
				this.makeTdBlank(animation[i].x[1], animation[i].y[1]);
				this.makeTdColorful(animation[0].x[0], animation[0].y[0], this.nextCapsule[0].color, 0, animation[0].rotation[0]);
				this.makeTdColorful(animation[0].x[1], animation[0].y[1], this.nextCapsule[1].color, 0, animation[0].rotation[1]);
				this.setHand(animation[0].hand);
				this.gameBoard = gameBoard;
				this.putCapsuleOnGameBoard();
				this.interval = this.intervalStart();
				this.stopAnyInput = false;
				return;
			}
			this.makeTdBlank(animation[i - 1].x[0], animation[i - 1].y[0]);
			this.makeTdBlank(animation[i - 1].x[1], animation[i - 1].y[1]);
			this.makeTdColorful(animation[i].x[0], animation[i].y[0], this.capsule[0].color, 0, animation[i].rotation[0]);
			this.makeTdColorful(animation[i].x[1], animation[i].y[1], this.capsule[1].color, 0, animation[i].rotation[1]);
			this.setHand(animation[i].hand);
			i++;
			timeout(20);
		}, delay);
		timeout(200);
	},
	setHand(newHand)
	{
		for(const hand of ["up", "middle", "down"])
		{
			let div = document.getElementById("hand" + hand.title());
			if(hand !== newHand)
				div.style.display = "none";
			else
				div.style.display = "block";
		}
	},
	moveTd(oldX, oldY, newX, newY)
	{
		let oldTd = this.getTd(oldX, oldY),
			newTd = this.getTd(newX, newY);
		
		newTd.className = oldTd.className;
		newTd.dataset.id = oldTd.dataset.id;
		if(oldTd.dataset.willFall !== undefined)
			newTd.dataset.willFall = oldTd.dataset.willFall;
		this.removeWillFall(oldX, oldY);
		this.makeTdBlank(oldX, oldY);
	},
	removeWillFall(x, y)
	{
		this.getTd(x, y).removeAttribute("data-will-fall");
	},
	removeWillFallFromGameBoard()
	{
		for(let i = 0; i < GAME_BOARD_HEIGHT; i++)
			for(let j = 0; j < GAME_BOARD_WIDTH; j++)
				this.removeWillFall(i, j);
	},
	makeDots()
	{
		for(let i = 0; i < GAME_BOARD_HEIGHT; i++)
		{
			for(let j = 0; j < GAME_BOARD_WIDTH; j++)
			{
				if(!this.isTdBlank(i, j) && !this.isItCovid(i, j))
				{
					let secondPart = this.isItPartOfCapsule(i, j);
					if(secondPart.isEmpty())
					{
						let td = this.getTd(i, j),
							color = td.className[0];
						td.className = "";
						this.makeTdColorful(i, j, color, td.dataset.id.toNumber(), "dot");
					}
				}
			}
		}
	},
	stageOver(state)
	{
		clearInterval(this.interval);
		if(state === "gameOver")
			clearInterval(this.covidInterval);
		this.setDisplay(localStorage.top, "top");
		let div = document.getElementById(state);
		div.style.position = "absolute";
		div.style.top = (8 * 16).toPixels();
		div.style.left = state === "gameOver" ? (14 * 16).toPixels() : (12 * 16).toPixels();
		div.style.width = state === "gameOver" ? (224).toPixels() : (288).toPixels();
		div.style.height = (80).toPixels();
		div.style.background = `url("https://jopek.eu/maks/szkola/apkKli/drMarioFiles/graphics/${state}.png")`;
		if(state === "gameOver")
		{
			div = document.getElementById(state + "Doctor");
			div.style.position = "absolute";
			div.style.top = (40).toPixels();
			div.style.left = (472).toPixels();
			div.style.width = (124).toPixels();
			div.style.height = (126).toPixels();
			div.style.background = `url("https://jopek.eu/maks/szkola/apkKli/drMarioFiles/graphics/${state}Doctor.png")`;
			let url = "https://jopek.eu/maks/szkola/apkKli/drMarioFiles/graphics/bigCovid/",
				covids = [], colors = ["yellow", "red", "blue"], i = 0, frames = [2, 4];
			
			for(const color of colors)
				covids.push(document.getElementById("covid" + color.title()));
			
			this.covidInterval = setInterval(() => {
				if(i === frames.length)
					i = 0;
				covids.forEach((covid, k) => {
					covid.style.background = `url("${url + colors[k]}/${frames[i]}.png")`;
				});
				i++;
			}, 210);
		}
	},
	getWillFall(x, y)
	{
		return this.getTd(x, y).dataset.willFall;
	},
	getId(x, y)
	{
		return this.getTd(x, y).dataset.id;
	},
	isItCovid(x, y)
	{
		return this.getId(x, y) < 0;
	},
	isTdEmpty(x, y)
	{
		if(!x.isInRange(0, GAME_BOARD_HEIGHT, 'l') || !y.isInRange(0, GAME_BOARD_WIDTH, 'l'))
			return false;
		return this.isTdBlank(x, y) || this.getTd(x, y).dataset.willFall === "true";
	},
	putCapsuleOnGameBoard()
	{
		let rotation = this.getCapsuleDirection() === "horizontal" ? ["left", "right"] : ["down", "up"];
		this.capsule.forEach((cap, i) => {
			this.makeTdColorful(cap.x, cap.y, cap.color, cap.id, rotation[i]);
		});
	},
	makeTdBlank(x, y)
	{
		this.getTd(x, y).className = "";
		this.getTd(x, y).removeAttribute("data-id");
		this.removeWillFall(x, y);
	},
	getTdColor(x, y)
	{
		return this.getTd(x, y).className;
	},
	makeTdColorful(x, y, color, id, rotation)
	{
		this.getTd(x, y).dataset.id = id.toString();
		this.getTd(x, y).classList.add(color[0] + rotation.title());
	},
	removeCapsuleFromGameBoard()
	{
		for(let cap of this.capsule)
			this.makeTdBlank(cap.x, cap.y);
	},
	isTdBlank(x, y)
	{
		if([x, y].includes(-Infinity))
			return false;
		else if([x, y].includes(Infinity))
			return true;
		else
			return this.gameBoard.children[x].children[y].className === "";
	},
	areThoseWithinGameBoard(x, y)
	{
		return (x < GAME_BOARD_HEIGHT && x >= 0 && y < GAME_BOARD_WIDTH && y >= 0);
	},
	getCapsuleDirection()
	{
		return this.capsule[0].x === this.capsule[1].x ? "horizontal" : "vertical";
	},
	getTd(x, y)
	{
		return this.gameBoard.children[x].children[y];
	},
	max(a, b)
	{
		if(typeof a !== "number" && typeof b !== "number")
			throw new TypeError("a and b are not Number!");
		if(typeof a === "number" && typeof b === "number")
			return Math.max(a, b);
		if(typeof a === "number")
			return a;
		else
			return b;
	},
	generateSmallCovids()
	{
		let id = -1;
		for(let i = 0; i < this.covidNumber;)
		{
			let x = getRandomInt(Math.floor((1 / 3) * GAME_BOARD_HEIGHT), GAME_BOARD_HEIGHT),
				y = getRandomInt(0, GAME_BOARD_WIDTH),
				color = this.colors[i % this.colors.length];
			
			if(this.isTdBlank(x, y))
			{
				this.makeTdColorful(x, y, color, id--, "covid");
				i++;
			}
		}
	},
	generateBigCovids()
	{
		let url = "https://jopek.eu/maks/szkola/apkKli/drMarioFiles/graphics/bigCovid/",
			covids = [], colors = ["yellow", "red", "blue"], positions = [0, 6, 12], i = 0, frames = [2, 1, 2, 3, 2];
		
		for(const color of colors)
		{
			let div = document.getElementById("covid" + color.title());
			div.style.width = (64).toPixels();
			div.style.height = (48).toPixels();
			div.style.background = `url("${url + color + "/2.png"}")`;
			div.style.position = "absolute";
			div.style.top = (covidsPositions[positions[i]].top * 16).toPixels();
			div.style.left = (covidsPositions[positions[i]].left * 16).toPixels();
			covids.push(div);
			i++;
		}
		i = 0;
		this.covidInterval = setInterval(() => {
			if(i === frames.length)
				i = 0;
			covids.forEach((covid, k) => {
				covid.style.background = `url("${url + colors[k]}/${frames[i]}.png")`;
				if(i === 0)
				{
					if(positions[k] === covidsPositions.length)
						positions[k] = 0;
					let t = positions[k];
					covid.style.top = (covidsPositions[t].top * 16).toPixels();
					covid.style.left = (covidsPositions[t].left * 16).toPixels();
					positions[k]++;
				}
			});
			i++;
		}, 210);
		
	},
	generateHands()
	{
		let width, height, top, left,
			url = "https://jopek.eu/maks/szkola/apkKli/drMarioFiles/graphics/hands/";
		for(const hand of ["up", "middle", "down"])
		{
			let div = document.createElement("div");
			if(hand === "up")
				[width, height, top, left] = [16, 48, 64, 496];
			else if(hand === "middle")
				[width, height, top, left] = [32, 32, 80, 480];
			else
				[width, height, top, left] = [16, 32, 96, 496];
			div.id = "hand" + hand.title();
			div.style.width = width;
			div.style.height = height;
			div.style.position = "absolute";
			div.style.top = top;
			div.style.left = left;
			div.style.background = `url("${url + hand + '.png'}")`;
			
			if(hand !== "up")
				div.style.display = "none";
			
			this.divGame.appendChild(div);
		}
	},
	setDisplay(value, display)
	{
		let maxLength = ["top", "score"].includes(display) ? 7 : 2;
		if(value.length > maxLength)
			throw new Error("@param value is too long");
		while(value.length !== maxLength)
			value = '0' + value;
		let top, left,
			url = "https://jopek.eu/maks/szkola/apkKli/drMarioFiles/graphics/numbers/";
		
		if(display === "top")
			[top, left] = [80, 80];
		else if(display === "score")
			[top, left] = [128, 80];
		else if(display === "covid")
			[top, left] = [336, 560];
		value.split('').forEach((char, i) => {
			let div = document.getElementById(display + i);
			if(div === null)
			{
				div = document.createElement("div");
				div.id = display + i;
				div.style.position = "absolute";
				div.style.width = (16).toPixels();
				div.style.height = div.style.width;
				div.style.top = top.toPixels();
				div.style.left = (left + i * div.style.width.toNumber()).toPixels();
				this.divGame.appendChild(div);
			}
			let newBackground = `url("${url + char + '.png'}")`;
			if(div.style.background !== newBackground)
				div.style.background = newBackground;
		});
		
	},
	setKeyboardEvents()
	{
		document.body.onkeydown = e => {
			if(this.stopAnyInput)
				return;
			if(["ArrowLeft", "KeyA"].includes(e.code))
				this.moveCapsule("left");
			else if(["ArrowRight", "KeyD"].includes(e.code))
				this.moveCapsule("right");
			else if(["ArrowDown", "KeyS"].includes(e.code))
				this.moveCapsule("down");
			else if(["ArrowUp", "keyW"].includes(e.code))
				this.rotateCapsule("left");
			else if(["ShiftLeft", "ShiftRight"].includes(e.code))
				this.rotateCapsule("right");
		};
	},
	generateGameBoard()
	{
		let divGame = document.getElementById("game");
		this.divGame = divGame;
		divGame.style.width = (640).toPixels();
		divGame.style.height = (384).toPixels();
		divGame.style.background = "url('https://jopek.eu/maks/szkola/apkKli/drMarioFiles/graphics/bg.png')";
		
		let gameBoard = document.getElementById("gameBoard");
		this.gameBoard = gameBoard;
		gameBoard.style.width = (128).toPixels();
		gameBoard.style.height = (256).toPixels();
		gameBoard.style.position = "absolute";
		gameBoard.style.top = (96).toPixels();
		gameBoard.style.left = (272).toPixels();
		
		for(let i = 0; i < GAME_BOARD_HEIGHT; i++)
		{
			let tr = document.createElement("tr");
			for(let j = 0; j < GAME_BOARD_WIDTH; j++)
			{
				let td = document.createElement("td");
				tr.appendChild(td);
			}
			gameBoard.appendChild(tr);
		}
		this.generateThrowTable();
	},
	generateThrowTable()
	{
		let table = document.getElementById("throwTable");
		this.throwTable = table;
		table.style.position = "absolute";
		table.style.left = (320).toPixels();
		for(let i = 0; i < 6; i++)
		{
			let tr = document.createElement("tr");
			for(let j = 0; j < 12; j++)
			{
				let td = document.createElement("td");
				td.style.width = (16).toPixels();
				td.style.height = td.style.width;
				tr.appendChild(td);
			}
			table.appendChild(tr);
		}
	}
};
function getRandomInt(min, max)
{
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
Array.prototype.deleteSameObjects = function() {
	let t = this.filter((value, index, array) => array.findIndex(t => (JSON.stringify(t) === JSON.stringify(value))) === index);
	this.length = 0;
	this.push.apply(this, t);
	return this;
};
Array.prototype.randomElement = function() {
	return this[getRandomInt(0, this.length)];
};
Number.prototype.isInRange = function(from, to, inclusively = '') {
	let wrongTypes = ["undefined", "boolean", "string", "symbol", "object", "function"];
	if(wrongTypes.includes(typeof from) || wrongTypes.includes(typeof to))
		throw new TypeError("Wrong data type!");
	switch(inclusively)
	{
		case '':
			return (this > from && this < to);
		case 'l':
			return (this >= from && this < to);
		case 'r':
			return (this > from && this <= to);
		case "lr":
			return (this >= from && this <= to);
		default:
			throw new TypeError("@param {string} inclusively can only be a value in ['', 'l', 'r', 'lr']!");
	}
};
Object.prototype.isEmpty = function() {
	return Object.keys(this).length === 0 && this.constructor === Object;
};
Number.prototype.toPixels = function() {
	return this.toString() + "px";
};
String.prototype.title = function() {
	return this.replace(/\w\S*/g, function(txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};
String.prototype.toNumber = function() {
	return parseFloat(this);
};