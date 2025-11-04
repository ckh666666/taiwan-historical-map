// 历史地图主程序
let mapWidth = 0;
let mapHeight = 0;
let currentPeriod = 'qing';  // 默认显示清治时期
let mapData = null;
let projection = null;
let path = null;

// 清治时期颜色方案
const qingColorScheme = {
    taipei_fu: "#2196F3",      // 蓝色 - 台北府
    taiwan_fu: "#4CAF50",      // 绿色 - 台湾府
    tainan_fu: "#FF9800",      // 橙色 - 台南府
    taitung_zhou: "#9C27B0"    // 紫色 - 台东直隶州
};

// 荷西时期颜色方案
const dutchSpanishColorScheme = {
    dutchDirect: "#2E7D32",     // 深绿色 - 荷兰完全控制
    dutchIndirect: "#A5D6A7",   // 浅绿色 - 荷兰部分控制
    spanishDirect: "#1565C0",   // 深蓝色 - 西班牙完全控制
    spanishIndirect: "#90CAF9", // 浅蓝色 - 西班牙部分控制
    mingControl: "#FFEB3B"      // 黄色 - 明朝控制（澎湖）
};

// 获取县市颜色
function getCountyColor(countyId, period) {
    const periodData = historicalPeriods[period];
    if (!periodData || !periodData.controlMapping) {
        return colorScheme.uncontrolled;
    }
    
    const mapping = periodData.controlMapping;
    
    // 清治时期特殊处理
    if (period === 'qing') {
        if (mapping.taipei_fu && mapping.taipei_fu.includes(countyId)) {
            return qingColorScheme.taipei_fu;
        }
        if (mapping.taiwan_fu && mapping.taiwan_fu.includes(countyId)) {
            return qingColorScheme.taiwan_fu;
        }
        if (mapping.tainan_fu && mapping.tainan_fu.includes(countyId)) {
            return qingColorScheme.tainan_fu;
        }
        if (mapping.taitung_zhou && mapping.taitung_zhou.includes(countyId)) {
            return qingColorScheme.taitung_zhou;
        }
        return colorScheme.uncontrolled;
    }
    // 荷西时期特殊处理
    if (period === 'dutch_spanish') {
        if (mapping.dutchDirect && mapping.dutchDirect.includes(countyId)) {
            return dutchSpanishColorScheme.dutchDirect;
        }
        if (mapping.dutchIndirect && mapping.dutchIndirect.includes(countyId)) {
            return dutchSpanishColorScheme.dutchIndirect;
        }
        if (mapping.spanishDirect && mapping.spanishDirect.includes(countyId)) {
            return dutchSpanishColorScheme.spanishDirect;
        }
        if (mapping.spanishIndirect && mapping.spanishIndirect.includes(countyId)) {
            return dutchSpanishColorScheme.spanishIndirect;
        }
        // 明朝控制区域暂不显示，视为未控制
        if (mapping.mingControl && mapping.mingControl.includes(countyId)) {
            return colorScheme.uncontrolled;
        }
        return colorScheme.uncontrolled;
    }
    
    // 其他时期
    if (mapping.direct && mapping.direct.includes(countyId)) {
        return colorScheme.direct;
    }
    if (mapping.indirect && mapping.indirect.includes(countyId)) {
        return colorScheme.indirect;
    }
    if (mapping.influence && mapping.influence.includes(countyId)) {
        return colorScheme.influence;
    }
    
    return colorScheme.uncontrolled;
}

// 获取图例标签（根据时期不同）
function getLegendLabels(period) {
    // 统一使用"完全控制"、"部分控制"、"未控制"
    if (period === 'dutch_spanish') {
        return {
            dutchDirect: '荷兰完全控制',
            dutchIndirect: '荷兰部分控制',
            spanishDirect: '西班牙完全控制',
            spanishIndirect: '西班牙部分控制'
        };
    }
    return { direct: '完全控制', indirect: '部分控制', influence: '影响范围' };
}

// 获取控制状态文字
function getControlStatus(countyId, period) {
    const periodData = historicalPeriods[period];
    if (!periodData || !periodData.controlMapping) {
        return "未控制";
    }
    
    const mapping = periodData.controlMapping;
    
    // 清治时期特殊处理 - 显示清朝地名和所属府
    if (period === 'qing' && periodData.qingNames) {
        const qingName = periodData.qingNames[countyId];
        if (qingName) {
            let fu = '';
            if (mapping.taipei_fu && mapping.taipei_fu.includes(countyId)) {
                fu = '（台北府）';
            } else if (mapping.taiwan_fu && mapping.taiwan_fu.includes(countyId)) {
                fu = '（台湾府）';
            } else if (mapping.tainan_fu && mapping.tainan_fu.includes(countyId)) {
                fu = '（台南府）';
            } else if (mapping.taitung_zhou && mapping.taitung_zhou.includes(countyId)) {
                fu = '（台东直隶州）';
            }
            return qingName + fu;
        }
        return "未控制";
    }
    // 荷西时期
    if (period === 'dutch_spanish') {
        // 悬停显示统一为所辖行政区说明
        if (mapping.dutchDirect && mapping.dutchDirect.includes(countyId)) return '荷兰台湾长官行政辖区';
        if (mapping.dutchIndirect && mapping.dutchIndirect.includes(countyId)) return '荷兰台湾长官行政辖区';
        if (mapping.spanishDirect && mapping.spanishDirect.includes(countyId)) return '西班牙长官辖区';
        if (mapping.spanishIndirect && mapping.spanishIndirect.includes(countyId)) return '西班牙长官辖区';
        return '未控制区域';
    }
    
    // 其他时期
    const labels = getLegendLabels(period);
    
    if (mapping.direct && mapping.direct.includes(countyId)) {
        return labels.direct;
    }
    if (mapping.indirect && mapping.indirect.includes(countyId)) {
        return labels.indirect;
    }
    if (mapping.influence && mapping.influence.includes(countyId)) {
        return labels.influence;
    }
    
    return "未控制";
}

// 初始化地图
function initMap() {
    const container = d3.select('#historical-map');
    const containerNode = container.node();
    
    mapWidth = containerNode.getBoundingClientRect().width - 40;
    mapHeight = 600;  // 增加高度以更好地显示台湾地图
    
    // 设置SVG尺寸
    container
        .attr('width', mapWidth)
        .attr('height', mapHeight);
    
    // 创建投影 - 使用台湾的实际中心点
    // 台湾完整坐标范围：经度 119.3~122.0, 纬度 21.9~25.3
    projection = d3.geoMercator()
        .center([120.65, 23.6])  // 使用台湾实际中心点
        .scale(7000)
        .translate([mapWidth / 2, mapHeight / 2]);
    
    path = d3.geoPath().projection(projection);
    
    // 如果初始时期是清治时期，直接加载清代地图
    if (currentPeriod === 'qing') {
        loadPeriod(currentPeriod);
    } else {
        // 其他时期加载现代县市地图数据
        d3.json("counties.json")
            .then(function(topology) {
                mapData = topology;
                const counties = topojson.feature(topology, topology.objects.map);
                
                // 绘制县市地图
                drawCounties(counties);
                
                // 加载当前时期的数据
                loadPeriod(currentPeriod);
                
                // 隐藏加载指示器
                setTimeout(() => {
                    d3.select('#loading-indicator').style('display', 'none');
                }, 500);
            })
            .catch(function(error) {
                console.error('加载地图数据失败:', error);
                d3.select('#loading-indicator')
                    .select('span')
                    .text('地图数据加载失败，请检查网络连接');
            });
    }
}

// 绘制县市地图
function drawCounties(counties) {
    const svg = d3.select('#historical-map');
    
    // 清空旧地图
    svg.selectAll('path.county').remove();
    
    // 绘制县市
    svg.selectAll('path.county')
        .data(counties.features)
        .enter()
        .append('path')
        .attr('class', 'county')
        .attr('d', path)
        .attr('display', function(d) {
            const periodData = historicalPeriods[currentPeriod];
            const hidden = periodData && periodData.hiddenCounties;
            return hidden && hidden.includes(d.properties.id) ? 'none' : null;
        })
        .attr('fill', function(d) {
            // 如果是现代时期，使用现代地图配置的颜色
            if (currentPeriod === 'modern' && typeof modernMapConfig !== 'undefined') {
                return modernMapConfig.getColor(d.properties.name);
            }
            // 否则根据控制状态获取颜色
            return getCountyColor(d.properties.id, currentPeriod);
        })
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event, d) {
            // 高亮显示
            d3.select(this)
                .attr('fill-opacity', 0.9)
                .attr('stroke', '#000')
                .attr('stroke-width', 1.5);
            
            // 显示工具提示
            const countyName = d.properties.name;
            const countyId = d.properties.id;
            
            let tooltipContent = '';
            if (currentPeriod === 'modern' && typeof modernMapConfig !== 'undefined') {
                const info = modernMapConfig.getInfo(countyName);
                tooltipContent = `
                    <div style="text-align: left;">
                        <strong style="font-size: 16px;">${countyName}</strong><br/>
                        <span style="color: #666;">类型：${info.typeName}</span><br/>
                        <small style="color: #999;">现代行政区划</small>
                    </div>
                `;
            } else {
                const controlStatus = getControlStatus(countyId, currentPeriod);
                if (currentPeriod === 'dutch_spanish') {
                    const modernName = (typeof countyCodes !== 'undefined' && countyCodes[countyId]) ? countyCodes[countyId] : countyName;
                    tooltipContent = `
                        <div style="text-align: left;">
                            <strong style="font-size: 16px;">${controlStatus}</strong><br/>
                            <span style="color: #ccc;">（今${modernName}）</span>
                        </div>
                    `;
                } else {
                    tooltipContent = `${countyName}<br/>控制状态: ${controlStatus}`;
                }
            }
            
            showTooltip(event, tooltipContent);
        })
        .on('mouseout', function() {
            // 恢复原样
            d3.select(this)
                .attr('fill-opacity', 0.7)
                .attr('stroke', '#000')
                .attr('stroke-width', 0.5);
            
            hideTooltip();
        });
}

// 加载特定时期的数据
function loadPeriod(period) {
    currentPeriod = period;
    const periodData = historicalPeriods[period];
    
    if (!periodData) return;
    
    // 更新界面
    updateUI(periodData);
    
    // 清治时期使用专门的清代地图
    if (period === 'qing') {
        // 清除现代县市地图和其他历史地图
        d3.select('#historical-map').selectAll('path.county').remove();
        d3.select('#historical-map').selectAll('path.ming-region').remove();
        d3.select('#historical-map').selectAll('path.ming-base').remove();
        
        // 加载清代地图
        loadQingMap();
        updateQingLegend();
    } 
    // 明郑时期使用专门的明郑地图
    else if (period === 'ming') {
        // 清除现代县市地图和其他历史地图
        d3.select('#historical-map').selectAll('path.county').remove();
        d3.select('#historical-map').selectAll('path.qing-region').remove();
        d3.select('#historical-map').selectAll('path.qing-base').remove();
        d3.select('#historical-map').selectAll('path.japanese-region').remove();
        
        // 加载明郑地图（包含台湾底图）
        loadMingMap();
        updateMingLegend();
    }
    // 日据时期使用专门的日据地图
    else if (period === 'japanese') {
        // 清除现代县市地图和其他历史地图
        d3.select('#historical-map').selectAll('path.county').remove();
        d3.select('#historical-map').selectAll('path.qing-region').remove();
        d3.select('#historical-map').selectAll('path.qing-base').remove();
        d3.select('#historical-map').selectAll('path.ming-region').remove();
        d3.select('#historical-map').selectAll('path.ming-base').remove();
        
        // 加载日据时期地图
        loadJapaneseMap();
        updateJapaneseLegend();
    }
    else {
        // 清除清代地图、明郑地图和日据地图
        d3.select('#historical-map').selectAll('path.qing-region').remove();
        d3.select('#historical-map').selectAll('path.qing-base').remove();
        d3.select('#historical-map').selectAll('path.ming-region').remove();
        d3.select('#historical-map').selectAll('path.ming-base').remove();
        d3.select('#historical-map').selectAll('path.japanese-region').remove();
        
        // 其他时期使用现代县市边界
        // 如果还没有加载县市地图数据，先加载
        if (!mapData) {
            d3.json("counties.json")
                .then(function(topology) {
                    mapData = topology;
                    const counties = topojson.feature(topology, topology.objects.map);
                    drawCounties(counties);
                    updateMapColors(periodData);
                })
                .catch(function(error) {
                    console.error('加载县市地图数据失败:', error);
                });
        } else {
            // 如果已有数据，检查是否需要重新绘制
            if (d3.select('#historical-map').selectAll('path.county').empty()) {
                const counties = topojson.feature(mapData, mapData.objects.map);
                drawCounties(counties);
            }
            updateMapColors(periodData);
        }
    }
}

// 更新UI显示
function updateUI(periodData) {
    // 更新标题
    d3.select('#current-period-name').text(periodData.name);
    d3.select('#current-period-years').text(periodData.years);
    
    // 更新历史介绍
    d3.select('#info-title').text(periodData.info.title);
    d3.select('#info-years').text(periodData.info.years);
    d3.select('#info-content').html(periodData.info.content);
    
    // 更新按钮状态
    d3.selectAll('.period-btn')
        .classed('active', false);
    
    d3.select(`[data-period="${currentPeriod}"]`)
        .classed('active', true);
    
    // 显示/隐藏详细地图按钮（如果存在）
    const viewBtn = document.getElementById('view-detailed-map');
    if (viewBtn) {
        if (periodData.detailedMap) {
            viewBtn.style.display = 'inline-block';
        } else {
            viewBtn.style.display = 'none';
        }
    }
    
    // 更新史料内容
    updateHistoricalText(periodData);
}

// 更新史料内容
function updateHistoricalText(periodData) {
    const textPanel = document.getElementById('historical-text-panel');
    const textContent = document.getElementById('historical-text-content');
    
    if (periodData && periodData.historicalText) {
        // 显示史料面板
        textPanel.style.display = 'block';
        textContent.innerHTML = periodData.historicalText;
        // 确保史料内容展开
        textContent.classList.remove('collapsed');
        // 重置按钮文字
        const btn = document.getElementById('toggle-historical-text-btn');
        if (btn) {
            btn.querySelector('span').style.display = 'inline';
            btn.querySelector('span:last-child').style.display = 'none';
        }
    } else {
        // 隐藏史料面板
        textPanel.style.display = 'none';
    }
}

// 更新地图颜色
function updateMapColors(periodData) {
    if (!mapData) return;
    
    const counties = topojson.feature(mapData, mapData.objects.map);
    
    d3.select('#historical-map')
        .selectAll('path.county')
        .data(counties.features)
        .transition()
        .duration(500)
        .attr('fill', function(d) {
            // 如果是现代时期，使用现代地图配置的颜色
            if (currentPeriod === 'modern' && typeof modernMapConfig !== 'undefined') {
                return modernMapConfig.getColor(d.properties.name);
            }
            // 否则根据控制状态获取颜色
            return getCountyColor(d.properties.id, currentPeriod);
        })
        .attr('display', function(d) {
            const periodData = historicalPeriods[currentPeriod];
            const hidden = periodData && periodData.hiddenCounties;
            return hidden && hidden.includes(d.properties.id) ? 'none' : null;
        });
    
    // 更新图例
    updateLegend(periodData);
}

// 更新图例
function updateLegend(periodData) {
    const legend = d3.select('.map-legend');
    const legendItems = legend.select('.legend-items');
    
    // 更新图例标题
    let legendTitle = '控制范围';
    if (currentPeriod === 'qing' || currentPeriod === 'modern') {
        legendTitle = '行政区划';
    }
    legend.select('h4').text(legendTitle);
    
    // 清空旧图例
    legendItems.selectAll('.legend-item').remove();
    legendItems.selectAll('div').remove();
    
    const items = [];
    
    // 现代时期特殊处理 - 显示县市分类
    if (currentPeriod === 'modern' && typeof modernMapConfig !== 'undefined') {
        const legendData = getModernLegendData();
        legendData.forEach(item => {
            items.push({ 
                color: item.color, 
                label: `${item.name}（${item.count}个）`,
                subtitle: item.examples
            });
        });
    }
    // 清治时期特殊处理 - 显示四府
    else if (currentPeriod === 'qing') {
        const mapping = periodData.controlMapping;
        if (mapping.taipei_fu && mapping.taipei_fu.length > 0) {
            items.push({ color: qingColorScheme.taipei_fu, label: '台北府' });
        }
        if (mapping.taiwan_fu && mapping.taiwan_fu.length > 0) {
            items.push({ color: qingColorScheme.taiwan_fu, label: '台湾府' });
        }
        if (mapping.tainan_fu && mapping.tainan_fu.length > 0) {
            items.push({ color: qingColorScheme.tainan_fu, label: '台南府' });
        }
        if (mapping.taitung_zhou && mapping.taitung_zhou.length > 0) {
            items.push({ color: qingColorScheme.taitung_zhou, label: '台东直隶州' });
        }
    } else if (currentPeriod === 'dutch_spanish') {
        const labels = getLegendLabels(currentPeriod);
        items.push({ color: dutchSpanishColorScheme.dutchDirect, label: labels.dutchDirect });
        items.push({ color: dutchSpanishColorScheme.dutchIndirect, label: labels.dutchIndirect });
        items.push({ color: dutchSpanishColorScheme.spanishDirect, label: labels.spanishDirect });
        items.push({ color: dutchSpanishColorScheme.spanishIndirect, label: labels.spanishIndirect });
        items.push({ color: colorScheme.uncontrolled, label: '未控制' });
    } else {
        // 其他时期
        const mapping = periodData.controlMapping;
        const labels = getLegendLabels(currentPeriod);
        
        if (mapping.direct && mapping.direct.length > 0) {
            items.push({ color: colorScheme.direct, label: labels.direct });
        }
        if (mapping.indirect && mapping.indirect.length > 0) {
            items.push({ color: colorScheme.indirect, label: labels.indirect });
        }
        if (mapping.influence && mapping.influence.length > 0) {
            items.push({ color: colorScheme.influence, label: labels.influence });
        }
        
        items.push({ color: colorScheme.uncontrolled, label: '未控制' });
    }
    
    const itemNodes = legendItems.selectAll('.legend-item')
        .data(items)
        .enter()
        .append('div')
        .attr('class', 'legend-item')
        .attr('title', d => d.subtitle || '');
    
    itemNodes.append('span')
        .attr('class', 'legend-color')
        .style('background', d => d.color);
    
    itemNodes.append('span')
        .attr('class', 'legend-label')
        .html(d => {
            if (d.subtitle) {
                return `${d.label}<br/><small style="color: #999; font-size: 11px;">${d.subtitle}</small>`;
            }
            return d.label;
        });
    
    // 为现代时期添加说明文字
    if (currentPeriod === 'modern' && typeof modernMapConfig !== 'undefined') {
        legendItems.append('div')
            .style('margin-top', '10px')
            .style('padding-top', '10px')
            .style('border-top', '1px solid #e0e0e0')
            .style('font-size', '12px')
            .style('color', '#666')
            .html('<strong>现代台湾行政区划</strong><br/>共22个县市（6直辖市 + 3市 + 13县）');
    }
}

// 显示工具提示
function showTooltip(event, text) {
    const tooltip = d3.select('#tooltip');
    tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .html(text)
        .classed('show', true);
}

// 隐藏工具提示
function hideTooltip() {
    d3.select('#tooltip').classed('show', false);
}

// 折叠/展开历史介绍
function toggleInfoPanel() {
    const content = d3.select('#info-content');
    const btn = d3.select('#toggle-info-btn');
    
    if (content.classed('collapsed')) {
        content.classed('collapsed', false);
        btn.select('span').style('display', 'inline');
        btn.select('span:last-child').style('display', 'none');
    } else {
        content.classed('collapsed', true);
        btn.select('span').style('display', 'none');
        btn.select('span:last-child').style('display', 'inline');
    }
}

// 打开详细地图
function openDetailedMap() {
    const periodData = historicalPeriods[currentPeriod];
    if (!periodData || !periodData.detailedMap) return;
    
    const modal = document.getElementById('detailed-map-modal');
    const title = document.getElementById('detailed-map-title');
    const image = document.getElementById('detailed-map-image');
    const credits = document.getElementById('map-credits');
    
    title.textContent = periodData.name + ' - 详细地图';
    image.src = periodData.detailedMap;
    image.alt = periodData.name + '详细地图';
    
    // 显示版权信息
    if (periodData.credits) {
        credits.innerHTML = periodData.credits;
        credits.style.display = 'block';
    } else {
        credits.style.display = 'none';
    }
    
    modal.classList.add('show');
}

// 关闭详细地图
function closeDetailedMap() {
    const modal = document.getElementById('detailed-map-modal');
    modal.classList.remove('show');
}

// 事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 初始化地图
    initMap();
    
    // 时期选择按钮
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.getAttribute('data-period');
            loadPeriod(period);
        });
    });
    
    // 折叠/展开按钮
    document.getElementById('toggle-info-btn').addEventListener('click', toggleInfoPanel);
    
    // 史料收起/展开按钮
    const toggleHistoricalTextBtn = document.getElementById('toggle-historical-text-btn');
    if (toggleHistoricalTextBtn) {
        toggleHistoricalTextBtn.addEventListener('click', function() {
            const content = document.getElementById('historical-text-content');
            const btn = this;
            
            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                btn.querySelector('span').style.display = 'inline';
                btn.querySelector('span:last-child').style.display = 'none';
            } else {
                content.classList.add('collapsed');
                btn.querySelector('span').style.display = 'none';
                btn.querySelector('span:last-child').style.display = 'inline';
            }
        });
    }
    
    // 缩放控制按钮
    document.getElementById('zoom-in').addEventListener('click', function() {
        // 将来可以实现缩放功能
        console.log('放大地图');
    });
    
    document.getElementById('zoom-out').addEventListener('click', function() {
        // 将来可以实现缩放功能
        console.log('缩小地图');
    });
    
    document.getElementById('reset-zoom').addEventListener('click', function() {
        // 将来可以实现重置功能
        console.log('重置地图');
    });
    
    // 详细地图按钮（如果存在）
    const viewDetailedBtn = document.getElementById('view-detailed-map');
    if (viewDetailedBtn) {
        viewDetailedBtn.addEventListener('click', openDetailedMap);
    }
    
    // 关闭详细地图按钮
    const closeBtn = document.getElementById('close-detailed-map');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDetailedMap);
    }
    
    // 点击模态框背景关闭
    const modal = document.getElementById('detailed-map-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDetailedMap();
            }
        });
    }
    
    console.log('🗺️ 台湾历史地图系统已加载');
});
