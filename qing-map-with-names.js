// 清代台湾行政区划地图数据（1894年）
// 根据1889b_1.json和历史地图标注创建

const qingRegionData = {
    // 区域名称和所属府/州的映射
    // 索引对应1889b_1.json中的geometries数组索引
    // 根据1894年（光绪20年）台湾行政区划
    // 台北府：宜兰县、基隆厅、淡水县、新竹县
    // 台湾府（设于台中）：台湾县、彰化县、埔里社厅、苗栗县、云林县
    // 台南府：嘉义县、安平县、凤山县、恒春县、澎湖厅
    // 台东直隶州
    regions: {
        0: { name: "安平县", fu: "台南府", color: "#FF9800" },
        1: { name: "宜兰县", fu: "台北府", color: "#2196F3" },
        2: { name: "恒春县", fu: "台南府", color: "#FF9800" },
        3: { name: "苗栗县", fu: "台湾府", color: "#4CAF50" },
        4: { name: "台湾县", fu: "台湾府", color: "#4CAF50" },
        5: { name: "基隆厅", fu: "台北府", color: "#2196F3" },
        6: { name: "淡水县", fu: "台北府", color: "#2196F3" },
        7: { name: "云林县", fu: "台湾府", color: "#4CAF50" },
        8: { name: "新竹县", fu: "台北府", color: "#2196F3" },
        9: { name: "嘉义县", fu: "台南府", color: "#FF9800" },
        10: { name: "埔里社厅", fu: "台湾府", color: "#4CAF50" },
        11: { name: "澎湖厅", fu: "台南府", color: "#FF9800" },
        12: { name: "彰化县", fu: "台湾府", color: "#4CAF50" },
        13: { name: "台东直隶州", fu: "直隶州", color: "#9C27B0" },
        14: { name: "凤山县", fu: "台南府", color: "#FF9800" },
        15: { name: "澎湖厅（离岛）", fu: "台南府", color: "#FF9800" },
        16: { name: "澎湖厅（外岛）", fu: "台南府", color: "#FF9800" }
    },
    
    // 中央山地（未开发区域）
    unmappedColor: "#E0E0E0",  // 浅灰色（荷治风格）
    unmappedName: "中央山地（未控制区域）",
    
    // 府的颜色方案
    fuColors: {
        "台北府": "#2196F3",      // 蓝色
        "台湾府": "#4CAF50",      // 绿色
        "台南府": "#FF9800",      // 橙色
        "直隶州": "#9C27B0"       // 紫色
    },
    
    // 府的完整信息
    fuInfo: {
        "台北府": {
            name: "台北府",
            counties: ["宜兰县", "基隆厅", "淡水县", "新竹县"],
            description: "台北府设立于1875年（光绪元年），管辖台湾北部地区，共4个县厅"
        },
        "台湾府": {
            name: "台湾府",
            counties: ["台湾县", "彰化县", "埔里社厅", "苗栗县", "云林县"],
            description: "台湾府是清代台湾最早设立的府，管辖中部地区（设于台中），共5个县厅"
        },
        "台南府": {
            name: "台南府",
            counties: ["嘉义县", "安平县", "凤山县", "恒春县", "澎湖厅"],
            description: "台南府设立于1887年（光绪十三年），管辖南部地区，共5个县厅"
        },
        "台东直隶州": {
            name: "台东直隶州",
            counties: ["台东直隶州"],
            description: "台东直隶州设立于1888年（光绪十四年），直隶于台湾省"
        }
    }
};

// 根据区域索引获取区域信息
function getQingRegionInfo(index) {
    return qingRegionData.regions[index] || null;
}

// 根据区域索引获取颜色
function getQingRegionColor(index) {
    const region = qingRegionData.regions[index];
    return region ? region.color : qingRegionData.unmappedColor;
}

// 获取所有府的列表
function getQingFuList() {
    return Object.keys(qingRegionData.fuInfo);
}

