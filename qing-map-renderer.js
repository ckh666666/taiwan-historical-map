// 清代地图渲染器
// 使用counties.json作为底图 + 1889b_1 (1).json来渲染清代行政区划

let qingMapData = null;
let qingMapSvg = null;

// 加载并渲染清代地图（TopoJSON格式）
function loadQingMap() {
    const svg = d3.select('#historical-map');
    
    // 显示加载指示器
    d3.select('#loading-indicator').style('display', 'flex');
    
    console.log('🗺️ 开始加载清代地图数据（TopoJSON格式）...');
    
    // 清空旧地图
    svg.selectAll('path.qing-region').remove();
    svg.selectAll('path.qing-base').remove();
    
    // 同时加载两个TopoJSON文件：台湾底图 + 清代行政区划
    Promise.all([
        d3.json("counties.json"),           // 台湾完整轮廓（底图）
        d3.json("1889b_1 (1).json")        // 清代行政区划
    ]).then(function([countiesData, qingData]) {
        console.log('✓ 清代地图数据加载成功');
        console.log('  - 台湾底图数据类型:', countiesData.type);
        console.log('  - 清代区划数据类型:', qingData.type);
        
        qingMapData = qingData;
        
        // 从TopoJSON转换为GeoJSON Features
        const countiesFeatures = topojson.feature(countiesData, countiesData.objects.map).features;
        const qingGeojson = topojson.feature(qingData, qingData.objects['1889b_1']);
        const qingFeatures = qingGeojson.features;
        
        console.log('  - 台湾县市数量:', countiesFeatures.length);
        console.log('  - 清代区域数量:', qingFeatures.length);
        
        // 为每个清代feature添加索引（用于颜色映射）
        qingFeatures.forEach((feature, i) => {
            if (!feature.properties) {
                feature.properties = {};
            }
            feature.properties.index = i;
        });
        
        // 使用全局投影设置
        console.log('  - 投影中心:', projection.center());
        console.log('  - 投影缩放:', projection.scale());
        console.log('  - SVG尺寸:', mapWidth, 'x', mapHeight);
        
        // 第一层：渲染台湾完整轮廓（灰色底图，表示未设治区域）
        console.log('  - 开始渲染台湾底图（中央山地）...');
        renderQingBase(svg, countiesFeatures);
        
        // 第二层：渲染清代行政区划（彩色）
        console.log('  - 开始渲染清代行政区划（', qingFeatures.length, '个区域）...');
        renderQingRegions(svg, qingFeatures);
        
        // 隐藏加载指示器
        setTimeout(() => {
            d3.select('#loading-indicator').style('display', 'none');
        }, 500);
        
        console.log('✓ 清代地图加载完成');
        
    }).catch(function(error) {
        console.error('清代地图加载失败:', error);
        d3.select('#loading-indicator')
            .select('span')
            .text('清代地图数据加载失败');
    });
}

// 渲染台湾底图（中央山地）
function renderQingBase(svg, features) {
    svg.selectAll('path.qing-base')
        .data(features)
        .enter()
        .append('path')
        .attr('class', 'qing-base')
        .attr('d', path)
        .attr('display', function(d) {
            const hidden = (historicalPeriods.qing && historicalPeriods.qing.hiddenCounties) || [];
            return hidden.includes(d.properties.id) ? 'none' : null;
        })
        .attr('fill', qingRegionData.unmappedColor || '#E0E0E0')  // 浅灰色（荷治风格）
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
            d3.select(this)
                .attr('fill-opacity', 0.9)
                .attr('stroke-width', 1.5);
            
            showTooltip(event, `
                <div style="text-align: left;">
                    <strong style="font-size: 16px;">中央山地</strong><br/>
                    <span style="color: #666;">清朝未正式设治的山区</span><br/>
                    <small style="color: #999;">包括中央山脉及东部部分地区</small>
                </div>
            `);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('fill-opacity', 0.7)
                .attr('stroke-width', 0.5);
            hideTooltip();
        });
    
    console.log('    ✓ 底图渲染完成（中央山地）');
}

// 渲染清代行政区划
function renderQingRegions(svg, features) {
    const paths = svg.selectAll('path.qing-region')
        .data(features)
        .enter()
        .append('path')
        .attr('class', 'qing-region')
        .attr('d', function(d) {
            const pathString = path(d);
            if (!pathString) {
                console.warn('⚠ 路径生成失败，区域索引:', d.properties.index);
            }
            return pathString;
        })
        // 填色模式：根据所属府填充颜色
        .attr('fill', function(d) {
            const color = getQingRegionColor(d.properties.index);
            console.log('区域', d.properties.index, '颜色:', color);
            return color;
        })
        .attr('fill-opacity', 0.7)  // 填充透明度
        .attr('stroke', '#000')      // 黑色细线边界（荷治风格）
        .attr('stroke-width', 0.5)   // 细线
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            // 鼠标悬停：高亮显示（荷治风格）
            d3.select(this)
                .attr('fill-opacity', 0.9)
                .attr('stroke', '#000')
                .attr('stroke-width', 1.5);
            
            // 获取区域信息并显示
            const index = d.properties.index;
            const regionInfo = getQingRegionInfo(index);
            
            if (regionInfo) {
                const tooltipText = `
                    <div style="text-align: left;">
                        <strong style="font-size: 16px;">${regionInfo.name}</strong><br/>
                        <span style="color: #666;">所属：${regionInfo.fu}</span><br/>
                        <small style="color: #999;">清代行政区划</small>
                    </div>
                `;
                showTooltip(event, tooltipText);
            } else {
                // 未映射区域显示为中央山地
                showTooltip(event, `
                    <div style="text-align: left;">
                        <strong>${qingRegionData.unmappedName || '中央山地'}</strong><br/>
                        <small style="color: #999;">清朝未正式设治的山区</small>
                    </div>
                `);
            }
            
            console.log('悬停区域', index, '-', regionInfo ? regionInfo.name : '未命名');
        })
        .on('mouseout', function() {
            // 恢复原样（荷治风格）
            d3.select(this)
                .attr('fill-opacity', 0.7)
                .attr('stroke', '#000')
                .attr('stroke-width', 0.5);
            
            hideTooltip();
        })
        .on('click', function(event, d) {
            const index = d.properties.index;
            const regionInfo = getQingRegionInfo(index);
            console.log('点击区域', index, '-', regionInfo);
            
            if (regionInfo) {
                showQingRegionDetail(regionInfo);
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
    
    console.log('    渲染完成:');
    console.log('      - 成功:', successCount, '个区域');
    console.log('      - 失败:', failCount, '个区域');
    console.log('      - 总计:', features.length, '个区域');
    
    if (successCount === 0) {
        console.error('⚠ 警告：没有成功渲染任何区域！');
    } else {
        console.log('✓ 清代地图渲染成功（填色模式）');
    }
}

// 显示清代区域详细信息
function showQingRegionDetail(regionInfo) {
    console.log('区域详情:', regionInfo);
    // 可以在这里添加更多的交互功能
}

// 更新清代地图的图例
function updateQingLegend() {
    const legend = d3.select('.map-legend');
    const legendItems = legend.select('.legend-items');
    
    // 更新图例标题
    legend.select('h4').text('行政区划');
    
    // 清空旧图例
    legendItems.selectAll('.legend-item').remove();
    legendItems.selectAll('div').remove();
    
    // 添加各府的图例
    const fuList = [
        { name: "台北府", color: qingRegionData.fuColors["台北府"], counties: "宜兰县、基隆厅、淡水县、新竹县（4个）" },
        { name: "台湾府", color: qingRegionData.fuColors["台湾府"], counties: "台湾县、彰化县、埔里社厅、苗栗县、云林县（5个）" },
        { name: "台南府", color: qingRegionData.fuColors["台南府"], counties: "嘉义县、安平县、凤山县、恒春县、澎湖厅（5个）" },
        { name: "台东直隶州", color: qingRegionData.fuColors["直隶州"], counties: "直隶于台湾省（1个）" },
        { name: "中央山地", color: qingRegionData.unmappedColor, counties: "未正式设治的山区" }
    ];
    
    const itemNodes = legendItems.selectAll('.legend-item')
        .data(fuList)
        .enter()
        .append('div')
        .attr('class', 'legend-item')
        .attr('title', d => d.counties);
    
    itemNodes.append('span')
        .attr('class', 'legend-color')
        .style('background', d => d.color);
    
    itemNodes.append('span')
        .attr('class', 'legend-label')
        .text(d => d.name);
    
    // 添加说明文字
    legendItems.append('div')
        .style('margin-top', '10px')
        .style('padding-top', '10px')
        .style('border-top', '1px solid #e0e0e0')
        .style('font-size', '12px')
        .style('color', '#666')
        .html('<strong>清光绪二十年（1894年）</strong><br/>三府一直隶州：共十一县三厅<br/><em style="font-size: 11px;">黑色细线边界，灰色为未设治区域</em>');
}
