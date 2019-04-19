const DefaultSettings = {
    "enabled": true,
    "autoHP": true,        // 自动服用回血药品
    "autoMP": true,        // 自动服用回蓝药品
    "notifications": true, // 服用药品时文字提示
    "potions": [
        {
            item: 6552,    // 药品 itemID编号
            hp: true,      // true: 回血药品 fals: 回蓝药品
            use_at: 50,    // 触发自动喝药的 百分量
            cd: 10,        // 冷却时间
            inCd: false,   // 冷却中 true 冷却完 false
            id: null,         // 药品数据库 id
            invQtd: 0,     // 药品库存量
            name: "高级HP恢复药水"
        },
        {item: 6550,   hp: true, use_at: 80, cd: 10, inCd: false, id: null, invQtd: 0, name: "低级HP恢复药水"},
        {item: 6551,   hp: true, use_at: 65, cd: 10, inCd: false, id: null, invQtd: 0, name: "中级HP恢复药水"},

        {item: 114,    hp: true, use_at: 35, cd: 30, inCd: false, id: null, invQtd: 0, name: "联盟补给品: 急速恢复药水 50%"},
        {item: 88802,  hp: true, use_at: 40, cd: 30, inCd: false, id: null, invQtd: 0, name: "联盟补给品: 萬能药 60%"},

        {item: 111,    hp: true, use_at: 18, cd: 30, inCd: false, id: null, invQtd: 0, name: "持续性恢复药水 75%"},
        {item: 112,    hp: true, use_at: 18, cd: 30, inCd: false, id: null, invQtd: 0, name: "联盟补给品: 性恢药水 75%"},
        {item: 149644, hp: true, use_at: 18, cd: 30, inCd: false, id: null, invQtd: 0, name: "联盟补给品: 持续性恢复药水 75%"},

        {item: 221225, hp: true, use_at: 8,  cd: 30, inCd: false, id: null, invQtd: 0, name: "凯亚的号角喇叭 100%"},
        {item: 206771, hp: true, use_at: 40, cd: 30, inCd: false, id: null, invQtd: 0, name: "[活動] 止痛劑 75%"},
        {item: 206772, hp: true, use_at: 12, cd: 30, inCd: false, id: null, invQtd: 0, name: "[活動] 急救箱 100%"},

        {item: 6560,  hp: false, use_at: 70, cd: 10, inCd: false, id: null, invQtd: 0, name: "低级MP恢复药水"},
        {item: 6561,  hp: false, use_at: 65, cd: 10, inCd: false, id: null, invQtd: 0, name: "中级MP恢复药水"},
        {item: 6562,  hp: false, use_at: 50, cd: 10, inCd: false, id: null, invQtd: 0, name: "高级MP恢复药水"}
    ]
};

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
    if (from_ver === undefined) {
        // Migrate legacy config file
        return Object.assign(Object.assign({}, DefaultSettings), settings);
    } else if (from_ver === null) {
        // No config file exists, use default settings
        return DefaultSettings;
    } else {
        // Migrate from older version (using the new system) to latest one
        if (from_ver + 1 < to_ver) {
            // Recursively upgrade in one-version steps
            settings = MigrateSettings(from_ver, from_ver + 1, settings);
            return MigrateSettings(from_ver + 1, to_ver, settings);
        }
        
        // If we reach this point it's guaranteed that from_ver === to_ver - 1, so we can implement
        // a switch for each version step that upgrades to the next version. This enables us to
        // upgrade from any version to the latest version without additional effort!
        switch(to_ver) {
            default:
                let oldsettings = settings
                
                settings = Object.assign(DefaultSettings, {});
                
                for(let option in oldsettings) {
                    if(settings[option]) {
                        settings[option] = oldsettings[option]
                    }
                }
                
                break;
        }
        
        return settings;
    }
}
