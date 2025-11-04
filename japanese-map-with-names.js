// 日据时期（1895-1945）行政区划数据
// 这里以1926年的行政区划为准（五州三厅时期）

const japaneseRegionData = {
    // 州厅颜色方案
    regionColors: {
        "臺北州": "#FFB6C1",      // 粉色
        "新竹州": "#FFE4C4",      // 米色
        "臺中州": "#FFFFE0",      // 浅黄色
        "臺南州": "#90EE90",      // 浅绿色
        "高雄州": "#DDA0DD",      // 浅紫色
        "臺東廳": "#FFB6D9",      // 粉色
        "花蓮港廳": "#E6D5E6",    // 浅粉紫色
        "澎湖廳": "#C8B4C8"       // 灰紫色
    },
    
    // 区域索引到名称的映射（根据实际TopoJSON确定）
    regions: [
        { index: 0, name: "花蓮港廳", romaji: "Karenkō" },
        { index: 1, name: "臺北州", romaji: "Taihoku" },
        { index: 2, name: "新竹州", romaji: "Shinchiku" },
        { index: 3, name: "臺中州", romaji: "Taichū" },
        { index: 4, name: "臺南州", romaji: "Tainan" },
        { index: 5, name: "臺東廳", romaji: "Taitō" },
        { index: 6, name: "高雄州", romaji: "Takao" },
        { index: 7, name: "澎湖廳", romaji: "Hōko" }
    ],
    
    // 行政区划说明
    regionInfo: {
        "臺北州": "首府：臺北市。管辖基隆、宜兰等地",
        "新竹州": "首府：新竹市。管辖桃园、新竹等地",
        "臺中州": "首府：臺中市。管辖苗栗、彰化、南投等地",
        "臺南州": "首府：臺南市。管辖嘉义、云林等地",
        "高雄州": "首府：高雄市。管辖屏东、台南等地",
        "臺東廳": "厅治：臺東。管辖台东地区",
        "花蓮港廳": "厅治：花蓮港。管辖花莲地区",
        "澎湖廳": "厅治：馬公。管辖澎湖群岛"
    }
};

// 根据索引获取区域颜色
function getJapaneseRegionColor(index) {
    const region = japaneseRegionData.regions.find(r => r.index === index);
    if (region) {
        return japaneseRegionData.regionColors[region.name];
    }
    return '#BDBDBD'; // 默认灰色
}

// 根据索引获取区域信息
function getJapaneseRegionInfo(index) {
    const region = japaneseRegionData.regions.find(r => r.index === index);
    if (region) {
        return {
            name: region.name,
            romaji: region.romaji,
            info: japaneseRegionData.regionInfo[region.name],
            color: japaneseRegionData.regionColors[region.name]
        };
    }
    return null;
}

