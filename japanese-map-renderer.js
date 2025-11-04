// 日据时期地图渲染器
// 使用1926d_1 (1).json来渲染日据时期行政区划（五州三厅时期）

let japaneseMapData = null;
let japaneseMapSvg = null;

// 加载并渲染日据时期地图（TopoJSON格式）
function loadJapaneseMap() {
    const svg = d3.select('#historical-map');
    
    // 显示加载指示器
    d3.select('#loading-indicator').style('display', 'flex');
    
    console.log('🗺️ 开始加载日据时期地图数据（TopoJSON格式）...');
    
    // 清空旧地图
    svg.selectAll('path.japanese-region').remove();
    
    // 加载日据时期地图TopoJSON
    d3.json("1926d_1 (1).json")
        .then(function(topology) {
            japaneseMapData = topology;
            
            console.log('✓ 日据时期地图数据加载成功');
            console.log('  - 数据类型:', topology.type);
            console.log('  - 对象:', Object.keys(topology.objects));
            
            // 从TopoJSON转换为GeoJSON Features
            const objectKey = Object.keys(topology.objects)[0]; // 获取第一个对象key
            const geojson = topojson.feature(topology, topology.objects[objectKey]);
            const features = geojson.features;
            
            console.log('  - 区域数量:', features.length);
            console.log('  - TopoJSON→GeoJSON 转换完成');
            
            // 为每个feature添加索引（用于颜色映射）
            features.forEach((feature, i) => {
                if (!feature.properties) {
                    feature.properties = {};
                }
                feature.properties.index = i;
            });
            
            // 使用全局投影设置
            console.log('  - 投影中心:', projection.center());
            console.log('  - 投影缩放:', projection.scale());
            console.log('  - SVG尺寸:', mapWidth, 'x', mapHeight);
            
            console.log('  - 开始渲染', features.length, '个区域...');
            
            // 渲染日据时期地图 - 填色模式
            const paths = svg.selectAll('path.japanese-region')
                .data(features)
                .enter()
                .append('path')
                .attr('class', 'japanese-region')
                .attr('d', function(d) {
                    const pathString = path(d);
                    if (!pathString) {
                        console.warn('⚠ 路径生成失败，区域索引:', d.properties.index);
                    }
                    return pathString;
                })
                // 填色模式：根据州厅填充颜色
                .attr('fill', function(d) {
                    const color = getJapaneseRegionColor(d.properties.index);
                    console.log('区域', d.properties.index, '颜色:', color);
                    return color;
                })
                .attr('fill-opacity', 0.7)  // 填充透明度
                .attr('stroke', '#000')      // 黑色细线边界
                .attr('stroke-width', 0.5)   // 细线
                .style('cursor', 'pointer')
                .on('mouseover', function(event, d) {
                    // 鼠标悬停：高亮显示
                    d3.select(this)
                        .attr('fill-opacity', 0.9)
                        .attr('stroke', '#000')
                        .attr('stroke-width', 1.5);
                    
                    // 获取区域信息并显示
                    const index = d.properties.index;
                    const regionInfo = getJapaneseRegionInfo(index);
                    
                    if (regionInfo) {
                        const tooltipText = `
                            <div style="text-align: left;">
                                <strong style="font-size: 16px;">${regionInfo.name}</strong><br/>
                                <span style="color: #999;">${regionInfo.romaji}</span><br/>
                                <span style="color: #666;">${regionInfo.info}</span><br/>
                                <small style="color: #999;">日据时期行政区划</small>
                            </div>
                        `;
                        showTooltip(event, tooltipText);
                    } else {
                        showTooltip(event, `
                            <div style="text-align: left;">
                                <strong>未命名区域</strong><br/>
                                <small style="color: #999;">索引: ${index}</small>
                            </div>
                        `);
                    }
                    
                    console.log('悬停区域', index, '-', regionInfo ? regionInfo.name : '未命名');
                })
                .on('mouseout', function() {
                    // 恢复原样
                    d3.select(this)
                        .attr('fill-opacity', 0.7)
                        .attr('stroke', '#000')
                        .attr('stroke-width', 0.5);
                    
                    hideTooltip();
                })
                .on('click', function(event, d) {
                    const index = d.properties.index;
                    const regionInfo = getJapaneseRegionInfo(index);
                    console.log('点击区域', index, '-', regionInfo);
                    
                    if (regionInfo) {
                        showJapaneseRegionDetail(regionInfo);
                    }
                });
            
            // 统计渲染结果
            let successCount = 0;
            let failCount = 0;
            
            paths.each(function(d) {
                const pathStr = path(d);
                if (pathStr) {
                    successCount++;
                } else {
                    failCount++;
                    console.error('  × 区域', d.properties.index, '渲染失败');
                }
            });
            
            console.log('渲染完成:');
            console.log('  - 成功:', successCount, '个区域');
            console.log('  - 失败:', failCount, '个区域');
            console.log('  - 总计:', features.length, '个区域');
            
            if (successCount === 0) {
                console.error('⚠ 警告：没有成功渲染任何区域！');
            } else {
                console.log('✓ 日据时期地图渲染成功（填色模式）');
            }
            
            // 隐藏加载指示器
            setTimeout(() => {
                d3.select('#loading-indicator').style('display', 'none');
            }, 500);
            
            console.log('✓ 日据时期地图加载完成');
        })
        .catch(function(error) {
            console.error('日据时期地图加载失败:', error);
            d3.select('#loading-indicator')
                .select('span')
                .text('日据时期地图数据加载失败');
        });
}

// 显示日据时期区域详细信息
function showJapaneseRegionDetail(regionInfo) {
    console.log('区域详情:', regionInfo);
    // 可以在这里添加更多的交互功能
}

// 更新日据时期地图的图例
function updateJapaneseLegend() {
    const legend = d3.select('.map-legend');
    const legendItems = legend.select('.legend-items');
    
    // 更新图例标题
    legend.select('h4').text('行政区划');
    
    // 清空旧图例
    legendItems.selectAll('.legend-item').remove();
    legendItems.selectAll('div').remove();
    
    // 添加各州厅的图例
    const regionList = [
        { name: "臺北州", color: japaneseRegionData.regionColors["臺北州"], romaji: "Taihoku" },
        { name: "新竹州", color: japaneseRegionData.regionColors["新竹州"], romaji: "Shinchiku" },
        { name: "臺中州", color: japaneseRegionData.regionColors["臺中州"], romaji: "Taichū" },
        { name: "臺南州", color: japaneseRegionData.regionColors["臺南州"], romaji: "Tainan" },
        { name: "高雄州", color: japaneseRegionData.regionColors["高雄州"], romaji: "Takao" },
        { name: "臺東廳", color: japaneseRegionData.regionColors["臺東廳"], romaji: "Taitō" },
        { name: "花蓮港廳", color: japaneseRegionData.regionColors["花蓮港廳"], romaji: "Karenkō" },
        { name: "澎湖廳", color: japaneseRegionData.regionColors["澎湖廳"], romaji: "Hōko" }
    ];
    
    const itemNodes = legendItems.selectAll('.legend-item')
        .data(regionList)
        .enter()
        .append('div')
        .attr('class', 'legend-item')
        .attr('title', d => japaneseRegionData.regionInfo[d.name]);
    
    itemNodes.append('span')
        .attr('class', 'legend-color')
        .style('background', d => d.color);
    
    itemNodes.append('span')
        .attr('class', 'legend-label')
        .html(d => `${d.name}<br/><small style="color: #999;">${d.romaji}</small>`);
    
    // 添加说明文字
    legendItems.append('div')
        .style('margin-top', '10px')
        .style('padding-top', '10px')
        .style('border-top', '1px solid #e0e0e0')
        .style('font-size', '12px')
        .style('color', '#666')
        .html('<strong>日据时期（1926年）</strong><br/>五州三厅制度<br/><em style="font-size: 11px;">黑色细线边界</em>');
}








