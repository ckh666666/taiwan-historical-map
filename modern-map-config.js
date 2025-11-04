// 现代时期（1945-至今）台湾行政区划配置
// 包含县、市、直辖市的分类和颜色方案

const modernMapConfig = {
    // 颜色方案
    colors: {
        municipality: "#2196F3",    // 直辖市 - 蓝色
        city: "#26A69A",            // 市 - 蓝绿色
        county: "#81C784"           // 县 - 浅绿色
    },
    
    // 直辖市（6个）
    municipalities: [
        "臺北市", "新北市", "桃園市", 
        "臺中市", "臺南市", "高雄市"
    ],
    
    // 市（3个省辖市，现已改制）
    cities: [
        "基隆市", "新竹市", "嘉義市"
    ],
    
    // 县（13个）
    counties: [
        "宜蘭縣", "新竹縣", "苗栗縣",
        "彰化縣", "南投縣", "雲林縣",
        "嘉義縣", "屏東縣", "臺東縣",
        "花蓮縣", "澎湖縣", "金門縣",
        "連江縣"
    ],
    
    // 根据县市名称获取类型
    getType: function(name) {
        // 移除可能的空格和变体
        const cleanName = name.trim();
        
        if (this.municipalities.includes(cleanName)) {
            return 'municipality';
        } else if (this.cities.includes(cleanName)) {
            return 'city';
        } else if (this.counties.includes(cleanName)) {
            return 'county';
        }
        
        // 处理可能的名称变体
        if (cleanName.includes('臺北市') || cleanName.includes('台北市')) return 'municipality';
        if (cleanName.includes('新北市')) return 'municipality';
        if (cleanName.includes('桃園市') || cleanName.includes('桃园市')) return 'municipality';
        if (cleanName.includes('臺中市') || cleanName.includes('台中市')) return 'municipality';
        if (cleanName.includes('臺南市') || cleanName.includes('台南市')) return 'municipality';
        if (cleanName.includes('高雄市')) return 'municipality';
        
        if (cleanName.includes('基隆市')) return 'city';
        if (cleanName.includes('新竹市')) return 'city';
        if (cleanName.includes('嘉義市') || cleanName.includes('嘉义市')) return 'city';
        
        // 默认返回县
        return 'county';
    },
    
    // 根据类型获取颜色
    getColor: function(name) {
        const type = this.getType(name);
        return this.colors[type];
    },
    
    // 获取类型的中文名称
    getTypeName: function(type) {
        const typeNames = {
            municipality: '直辖市',
            city: '市',
            county: '县'
        };
        return typeNames[type] || '未知';
    },
    
    // 获取县市的详细信息
    getInfo: function(name) {
        const type = this.getType(name);
        const typeName = this.getTypeName(type);
        const color = this.colors[type];
        
        return {
            name: name,
            type: type,
            typeName: typeName,
            color: color
        };
    }
};

// 获取现代地图的图例数据
function getModernLegendData() {
    return [
        { 
            type: 'municipality', 
            name: '直辖市', 
            color: modernMapConfig.colors.municipality,
            count: modernMapConfig.municipalities.length,
            examples: '臺北市、新北市、桃園市等'
        },
        { 
            type: 'city', 
            name: '市', 
            color: modernMapConfig.colors.city,
            count: modernMapConfig.cities.length,
            examples: '基隆市、新竹市、嘉義市'
        },
        { 
            type: 'county', 
            name: '县', 
            color: modernMapConfig.colors.county,
            count: modernMapConfig.counties.length,
            examples: '宜蘭縣、花蓮縣、澎湖縣等'
        }
    ];
}

