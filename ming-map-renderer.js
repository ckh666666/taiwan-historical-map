// 明郑时期地图渲染器
// 使用mj_b_1.json（设里疆界-大块区域）和mj_la_1.json（屯垦地-小点状区域）来渲染明郑行政区划

let mingMapData = null;
let mingMapSvg = null;

// 明郑地图颜色方案
const mingColorScheme = {
    border: "#FFC0CB",      // 粉色 - 设里疆界（大块区域）
    tunken: "#90EE90"       // 绿色 - 屯垦地（小点状区域）
};

// 加载并渲染明郑地图（TopoJSON格式）
function loadMingMap() {
    const svg = d3.select('#historical-map');
    // 获取或创建地图组
    let mapGroup = d3.select('#map-group');
    if (mapGroup.empty()) {
        mapGroup = svg.append('g').attr('id', 'map-group');
    }
    
    // 显示加载指示器
    d3.select('#loading-indicator').style('display', 'flex');
    
    console.log('🗺️ 开始加载明郑时期地图数据（TopoJSON格式）...');
    
    // 清空旧地图
    mapGroup.selectAll('path.ming-region').remove();
    mapGroup.selectAll('path.ming-base').remove();
    
    // 同时加载三个TopoJSON文件：台湾底图 + 明郑两个区域
    Promise.all([
        d3.json("counties.json"),   // 台湾完整轮廓（底图）
        d3.json("mj_b_1.json"),     // 设里疆界（大块区域）
        d3.json("mj_la_1.json")     // 屯垦地（小点状区域）
    ]).then(function([countiesData, borderData, tunkenData]) {
        console.log('✓ 明郑地图数据加载成功');
        console.log('  - 台湾底图数据类型:', countiesData.type);
        console.log('  - 设里疆界数据类型:', borderData.type);
        console.log('  - 屯垦地数据类型:', tunkenData.type);
        
        // 从TopoJSON转换为GeoJSON Features
        const countiesFeatures = topojson.feature(countiesData, countiesData.objects.map).features;
        const borderFeatures = topojson.feature(borderData, borderData.objects['mj_b_1']).features;
        const tunkenFeatures = topojson.feature(tunkenData, tunkenData.objects['mj_la_1']).features;
        
        console.log('  - 台湾县市数量:', countiesFeatures.length);
        console.log('  - 设里疆界区域数量:', borderFeatures.length);
        console.log('  - 屯垦地区域数量:', tunkenFeatures.length);
        
        // 使用全局投影设置
        console.log('  - 投影中心:', projection.center());
        console.log('  - 投影缩放:', projection.scale());
        
        // 第一层：渲染台湾完整轮廓（灰色底图，表示未控制区域）
        console.log('  - 开始渲染台湾底图（未控制区域）...');
        renderMingBase(mapGroup, countiesFeatures);
        
        // 第二层：渲染设里疆界区域（粉色，大块区域）
        console.log('  - 开始渲染设里疆界区域...');
        renderMingRegions(mapGroup, borderFeatures, 'border', '设里疆界');
        
        // 第三层：渲染屯垦地区域（绿色，小点状区域，最上层）
        console.log('  - 开始渲染屯垦地区域...');
        renderMingRegions(mapGroup, tunkenFeatures, 'tunken', '屯垦地');
        
        // 隐藏加载指示器
        setTimeout(() => {
            d3.select('#loading-indicator').style('display', 'none');
        }, 500);
        
        console.log('✓ 明郑地图加载完成');
        
    }).catch(function(error) {
        console.error('明郑地图加载失败:', error);
        d3.select('#loading-indicator')
            .select('span')
            .text('明郑地图数据加载失败');
    });
}

// 渲染台湾底图（灰色，表示未控制区域）
function renderMingBase(mapGroup, features) {
    mapGroup.selectAll('path.ming-base')
        .data(features)
        .enter()
        .append('path')
        .attr('class', 'ming-base')
        .attr('d', path)
        .attr('display', function(d) {
            const hidden = (historicalPeriods.ming && historicalPeriods.ming.hiddenCounties) || [];
            return hidden.includes(d.properties.id) ? 'none' : null;
        })
        .attr('fill', '#E0E0E0')       // 浅灰色（荷治风格）
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#000')        // 黑色细线边界
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            // 检查是否被明郑控制区域覆盖
            d3.select(this)
                .attr('fill-opacity', 0.9)
                .attr('stroke-width', 1.5);
            
            // 获取现代县市名称（与荷兰时期显示格式一致）
            const countyId = d.properties.id;
            const countyName = d.properties.name;
            const modernName = (typeof countyCodes !== 'undefined' && countyCodes[countyId]) ? countyCodes[countyId] : countyName;
            
            const tooltipText = `
                <div style="text-align: left;">
                    <strong style="font-size: 16px;">未控制区域</strong><br/>
                    <span style="color: #ccc;">（今${modernName}）</span>
                </div>
            `;
            showTooltip(event, tooltipText);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('fill-opacity', 0.7)
                .attr('stroke-width', 0.5);
            
            hideTooltip();
        });
    
    console.log('  ✓ 台湾底图渲染完成:', features.length, '个县市');
}

// 渲染明郑地图区域
function renderMingRegions(mapGroup, features, type, typeName) {
    const color = mingColorScheme[type];
    
    mapGroup.selectAll(`path.ming-region.${type}`)
        .data(features)
        .enter()
        .append('path')
        .attr('class', `ming-region ${type}`)
        .attr('d', function(d) {
            const pathString = path(d);
            if (!pathString) {
                console.warn('⚠ 路径生成失败');
            }
            return pathString;
        })
        .attr('fill', color)
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#000')      // 黑色细线边界（荷治风格）
        .attr('stroke-width', 0.5)   // 细线
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            // 鼠标悬停：高亮显示
            d3.select(this)
                .attr('fill-opacity', 0.9)
                .attr('stroke-width', 1.5);
            
            // 显示工具提示
            let regionName = typeName;
            let description = '';
            
            if (type === 'tunken') {
                regionName = '屯垦地';
                description = '明郑小块的屯垦开发区域（小点状）';
            } else {
                regionName = '设里疆界';
                description = '明郑设立行政管理的疆界区域（大块区域）';
            }
            
            const tooltipText = `
                <div style="text-align: left;">
                    <strong style="font-size: 16px;">${regionName}</strong><br/>
                    <span style="color: #666;">${description}</span><br/>
                    <small style="color: #999;">明郑时期行政区划</small>
                </div>
            `;
            showTooltip(event, tooltipText);
        })
        .on('mouseout', function() {
            // 恢复原样
            d3.select(this)
                .attr('fill-opacity', 0.7)
                .attr('stroke-width', 0.5);
            
            hideTooltip();
        })
        .on('click', function(event, d) {
            console.log('点击区域类型:', typeName);
        });
    
    console.log(`  ✓ ${typeName}渲染完成:`, features.length, '个区域');
}

// 更新明郑地图的图例
function updateMingLegend() {
    const legend = d3.select('.map-legend');
    const legendItems = legend.select('.legend-items');
    
    // 更新图例标题
    legend.select('h4').text('控制范围');
    
    // 清空旧图例
    legendItems.selectAll('.legend-item').remove();
    legendItems.selectAll('div').remove();
    
    // 添加控制类型的图例
    const controlTypes = [
        { name: "设里疆界", color: mingColorScheme.border, desc: "明郑设立行政管理的疆界区域（大块）" },
        { name: "屯垦地", color: mingColorScheme.tunken, desc: "明郑小块的屯垦开发区域（小点状）" },
        { name: "未控制区域", color: "#E0E0E0", desc: "未控制区域（多为山区）" }
    ];
    
    const itemNodes = legendItems.selectAll('.legend-item')
        .data(controlTypes)
        .enter()
        .append('div')
        .attr('class', 'legend-item')
        .attr('title', d => d.desc);
    
    itemNodes.append('span')
        .attr('class', 'legend-color')
        .style('background', d => d.color);
    
    itemNodes.append('span')
        .attr('class', 'legend-label')
        .text(d => d.name);
    
}

