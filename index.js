module.exports = function LetMePot(mod) {
	const command = mod.command || mod.require.command;
	
	if (mod.proxyAuthor !== 'caali') {
		const options = require('./module').options
		if (options) {
			const settingsVersion = options.settingsVersion
			if (settingsVersion) {
				mod.settings = require('./' + (options.settingsMigrator || 'settings_migrator.js'))(mod.settings._version, settingsVersion, mod.settings)
				mod.settings._version = settingsVersion
			}
		}
	}
	
	const potions = mod.settings.potions;
	
	let	oX = null,
		oY = null,
		oZ = null,
		oW = null,
		
		oHp = 100,
		oMp = 100,
		oAlive = false,
		oInCombat = false,
		getPotInfo = false;
	
	let hpPotList = potions.filter(function (p) { return p.hp == true; });
	let mpPotList = potions.filter(function (p) { return p.hp != true; });
	
	hpPotList.sort(function (a, b) { return parseFloat(a.use_at) - parseFloat(b.use_at); });
	mpPotList.sort(function (a, b) { return parseFloat(a.use_at) - parseFloat(b.use_at); });
	
	mod.command.add('药水', () => {
		mod.settings.enabled = !mod.settings.enabled;
		let txt = (mod.settings.enabled) ? '<font color="#56B4E9">启用</font>' : '<font color="#E69F00">禁用</font>';
		message(txt, true);
	});
	
	mod.command.add('药水计量', () => {
		mod.settings.notifications = !mod.settings.notifications;
		let txt = (mod.settings.notifications) ? '<font color="#56B4E9">启用</font>' : '<font color="#E69F00">禁用</font>';
		message('文字提示 ' + txt, true);
	});
	
	mod.command.add('药水绑定', () => {
		getPotInfo = true;
		message('使用1次您想要添加的[<font color="#56B4E9">药水</font>], 并在代理控制台中查看itemID', true);
	});
	
	mod.game.on('enter_game', () => {
		oAlive = true;
	});
	
	mod.game.on('leave_game', () => {
		oAlive = false;
		for (let j = 0; j < hpPotList.length; j++) {
			hpPotList[j].invQtd = 0;
			hpPotList[j].id = 0;
		}
		for (let k = 0; k < mpPotList.length; k++) {
			mpPotList[k].invQtd = 0;
			mpPotList[k].id = 0;
		}
	});
	
	mod.game.me.on('resurrect', () => {
		oAlive = true;
	});
	
	mod.game.me.on('die', () => {
		oAlive = false;
	});
	
	mod.game.me.on('enter_combat', () => {
		oInCombat = true;
	});
	
	mod.game.me.on('leave_combat', () => {
		oInCombat = false;
	});
	
	mod.hook('C_PLAYER_LOCATION', 5, { order: -2 }, (event) => {
		oX = (event.loc.x + event.dest.x) / 2;
		oY = (event.loc.y + event.dest.y) / 2;
		oZ = (event.loc.z + event.dest.z) / 2;
		oW = event.w;
	});
	
	mod.hook('C_USE_ITEM', 3, { order: -2 }, (event) => {
		if (getPotInfo && event.gameId == mod.game.me.gameId) {
			message('药品信息: { item: ' + event.id + ' }');
			getPotInfo = false;
		}
	});
	
	mod.hook('S_INVEN', 18, { order: -2 }, (event) => {
		if (!mod.settings.enabled) return; // Too much info, better just turn off if disabled
		
		for (const tempInv of event.items) {
			for (let o = 0; o < hpPotList.length; o++) {
				if (hpPotList[o].item == tempInv.id) {
					hpPotList[o].invQtd = tempInv.amount;
					hpPotList[o].id = tempInv.dbid;
				}
			}
			for (let p = 0; p < mpPotList.length; p++) {
				if (mpPotList[p].item == tempInv.id) {
					mpPotList[p].invQtd = tempInv.amount;
					mpPotList[p].id = tempInv.dbid;
				}
			}
		}
	});
	
	mod.hook('S_CREATURE_CHANGE_HP', 6, (event) => {
		if (!mod.settings.enabled || !mod.settings.autoHP) return;
		if (event.target != mod.game.me.gameId || !oInCombat || !oAlive) return;
		
		oHp = Math.round(Number(event.curHp) / Number(event.maxHp) * 100);
		
		for (let i = 0; i < hpPotList.length; i++) {
			if (oHp < hpPotList[i].use_at && !hpPotList[i].inCd && hpPotList[i].invQtd !== 0) {
				useItem(hpPotList[i]);
				
				hpPotList[i].inCd = true;
				setTimeout(function () {
					hpPotList[i].inCd = false;
				}, hpPotList[i].cd * 1000);
				
				break;
			}
		}
	});
	
	mod.hook('S_PLAYER_CHANGE_MP', 1, (event) => {
		if (!mod.settings.enabled || !mod.settings.autoMP) return;
		if (event.target != mod.game.me.gameId || !oInCombat || !oAlive) return;
		
		oMp = Math.round(Number(event.currentMp) / Number(event.maxMp) * 100);
		
		for (let i = 0; i < mpPotList.length; i++) {
			if (oMp < mpPotList[i].use_at && !mpPotList[i].inCd && mpPotList[i].invQtd !== 0) {
				useItem(mpPotList[i]);
				
				mpPotList[i].inCd = true;
				setTimeout(function () {
					mpPotList[i].inCd = false;
				}, mpPotList[i].cd * 1000);
				
				break;
			}
		}
	});
	
	function useItem(potInfo) {
		mod.send('C_USE_ITEM', 3, {
			gameId: mod.game.me.gameId,
			id: potInfo.item,
			dbid: potInfo.id,
			target: 0,
			amount: 1,
			dest: {x: 0, y: 0, z: 0},
			loc: {x: oX, y: oY, z: oZ},
			w: oW,
			unk1: 0,
			unk2: 0,
			unk3: 0,
			unk4: 1
		});
		
		if (mod.settings.notifications) {
			message('已使用 <font color="#56B4E9">' + potInfo.name + '</font> 剩余<font color="#E69F00">' + (--potInfo.invQtd) + '</font>瓶', true);
		}
	}
	
	function message(msg, chat = false) {
		if (chat == true) {
			mod.command.message(msg);
		} else {
			console.log('(Let Me Pot) ' + msg);
		}
	}
	
}
