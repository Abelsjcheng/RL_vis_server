import React from 'react';
import ReactDOM from 'react-dom';
import * as d3 from 'd3'
import KgSettingPanel from '../KgSettingsPanel/index'
import { forceManyBodyReuse } from 'd3-force-reuse'
import { splitLinkName, splitNodeName, findObjInArr } from '../../util/tool'
import './index.scss'

class Kg extends React.Component {
    constructor(props) {
        super(props);
        this._kgData = JSON.parse(JSON.stringify(props.kgData));
        this.simulation = d3.forceSimulation();
        this.zoom = d3.zoom();
        this.svg = null;
        this.svg_kg = null;
        this.linkGroup = null;
        this.marker = null;
        this.markerPath = null;
        this.nodeGroup = null;
        this.nodeGradient = null;
        this.linkTextGroup = null;
        this.updateLink = null;
        this.updateNode = null;
        this.updateLinkText = null;
        this.svgWidth = null;
        this.svgHeight = null;
        this.kgNetwork = React.createRef();
        this.state = {
            nodes: this._kgData.nodes,
            links: this._kgData.links,
            forceSet: {
                bodyStrength: -500, // 节点排斥力，负数为模拟电荷力
                linkDistance: 200, // 边长度
                nodeSize: 8, // 节点大小
                forceX: 0.01,
                forceY: 0.03
            },
            svgStyle: {
                linkWidth: 1,
                linkStroke: '#A5ABB6', // 边颜色
                linkLabelSize: 8,
                nodeColor: '#D3D3D3',
                nodeStroke: '#ACACAC',
                sourceNodeColor: "#F16667",
                sourceNodeStroke: "#EB2728",
                targetNodeColor: "#4C8EDA",
                targetNodeStroke: "#2870C2",
                nodeLabelSize: 10
            },
            switchSet: {
                showNodeText: false, // 显示隐藏节点标签
                showLinkText: false, // 显示隐藏关系标签
                autoZoomFlag: false, // 自适应缩放
                nodeFocusFlag: true,
            },
            highLightNode: null, // 当前高亮节点
            highLightLink: null,  // 当前高亮边
        };
    }
    componentDidMount() {
        // dom加载后调用
        if (this.props.onRef)
            this.props.onRef(this);
        this.initSvg()
        this.initializeForces(this.simulation)
        this.initializeKg()
    }

    componentDidUpdate(prevProps, prevState) {
        // state更新后,执行
        const { forceSet, svgStyle, switchSet, nodes, links } = this.state
        if (forceSet !== prevState.forceSet || links !== prevState.links) {
            // 重载force
            this.updateForces(this.simulation, nodes, links, forceSet)
            this.updateDragTick(this.simulation);
            this.updateKg()

            if (forceSet.nodeSize !== prevState.forceSet.nodeSize) {
                this.updateKgDisplay()
            }
        }
        else if (
            svgStyle !== prevState.svgStyle ||
            switchSet.showNodeText !== prevState.switchSet.showNodeText ||
            switchSet.showLinkText !== prevState.switchSet.showLinkText
        ) {
            this.updateKgDisplay()
        }
    }
    UNSAFE_componentWillReceiveProps(nextProps) {
        // 图谱更新
        const prevkgData = JSON.stringify(this.props.kgData),
            nextKgData = JSON.stringify(nextProps.kgData)
        if (prevkgData !== nextKgData) {
            const { switchSet } = this.state
            this._kgData = JSON.parse(nextKgData)
            this.setState({
                nodes: this._kgData.nodes,
                links: this._kgData.links,
                // switchSet: Object.assign({}, switchSet, { autoZoomFlag: true }),
            });
        }
    }
    initSvg() {
        const { nodes } = this.state
        const { curTriple } = this.props
        this.svgWidth = this.kgNetwork.current.offsetWidth
        this.svgHeight = this.kgNetwork.current.offsetHeight
        // 加载缩放
        this.zoom.scaleExtent([0.1, 4]).on('zoom', this.zoomed);

        const svgDOm = ReactDOM.findDOMNode(this);
        this.svg = d3.select(svgDOm)
            .append("svg")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight)
            .call(this.zoom)
            .on("click", this.handleSvgClick)

        this.svg_kg = this.svg
            .append("g")
            .attr("class", "svg-kg-content");

        nodes.forEach(d => {
            if (findObjInArr(d.group, "name", curTriple.sourceEntity) !== null) {
                d.x = this.svgWidth / 2
                d.y = this.svgHeight - 100

            } else if (findObjInArr(d.group, "name", curTriple.targetEntity) !== null) {
                d.x = this.svgWidth / 2
                d.y = 100
            }
        })
    }

    initializeForces(simulation) {
        // 绑定力
        const { nodes, links, forceSet } = this.state
        this.buildForces(simulation, this.svgWidth, this.svgHeight)
        // 更新力布局
        this.updateForces(simulation, nodes, links, forceSet);
        this.updateDragTick(simulation);
    }
    buildForces(simulation, width, height) {
        simulation
            .force("link", d3.forceLink())
            .force("charge", forceManyBodyReuse())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide())
            .force("forceX", d3.forceX(width / 2))
            .force("forceY", d3.forceY(height / 2));
    }
    updateForces = (simulation, nodes, links, forceSet) => {
        simulation.nodes(nodes)

        simulation.force("link")
            .id(function (d) { return d.id; })
            .links(links)
            .distance(forceSet.linkDistance)


        simulation.force("charge")
            .strength(forceSet.bodyStrength);

        // 碰撞半径
        let r_ratio = Math.max(...nodes.map(d => d.group ? d.group.length : 1)),
            collide_radius = Math.ceil(r_ratio > 1 ? Math.sqrt(r_ratio) + 2 : r_ratio) * forceSet.nodeSize

        simulation.force("collide")
            .strength(0.2)
            .radius(collide_radius)
            .iterations(1);

        simulation.force("forceX")
            .strength(forceSet.forceX);

        simulation.force("forceY")
            .strength(forceSet.forceY);
        simulation.alpha(1).restart();
    }

    initializeKg() {
        this.linkGroup = this.svg_kg.append("g")
            .attr("class", "link-group")

        let textGroup = this.svg_kg.append("g")
            .attr("class", "text-group")

        this.linkTextGroup = textGroup.append("g").attr("class", "linkText-group")

        this.nodeGroup = this.svg_kg.append("g")
            .attr("class", "node-group")

        this.updateKg()
    }
    updateKg = (source) => {
        const { links, nodes, svgStyle, forceSet, switchSet } = this.state
        const { curTriple } = this.props

        let link = this.linkGroup.selectAll("path.link")
            .data(links, d => d.id)

        setDoubleLink(links)

        link.exit().remove();

        let linkEnter = link.enter()
            .append("path")
            .attr("id", d => `link${d.id}`)
            .attr("class", "link")
            .on('mouseover', d => {
                d3.select(`#linkText${d.id}`)
                    .style("visibility", 'visible')
            })

        this.updateLink = linkEnter.merge(link)
            .style("stroke", svgStyle.linkStroke)
            .style("stroke-width", svgStyle.linkWidth)
            .style('fill', 'rgba(0, 0, 0, 0)')
            .attr("marker-end", d => {
                return d.type === "self" ? "url(#self)" : `url(#groupNum_${d.target.group.length})`
            });

        // 非自循环，自循环，分组聚合
        let markerData = ["noself", "self", ...new Set(nodes.map(d => {
            return `groupNum_${d.group.length}`
        }))]
        this.marker = this.linkGroup.selectAll("marker.marker")
            .data(markerData, d => d)

        this.marker.exit().remove();

        this.marker = this.marker.enter()
            .append("marker")
        this.markerPath = this.marker.append("path")

        this.marker
            .attr("id", d => d)
            .attr("markerUnits", "userSpaceOnUse")
            .attr("viewBox", `0 ${-forceSet.nodeSize * 0.3} ${forceSet.nodeSize * 0.6} ${forceSet.nodeSize * 0.6}`)
            .attr("refX", forceSet.nodeSize * 0.6)
            .attr("refY", 0)
            .attr("markerWidth", forceSet.nodeSize * 0.6)
            .attr("markerHeight", forceSet.nodeSize * 0.6)
            .attr("orient", "auto")
            .attr("stroke-width", svgStyle.linkWidth)

        this.markerPath
            .attr("d", `M0,${-forceSet.nodeSize * 0.3} L${forceSet.nodeSize * 0.6},0 L0,${forceSet.nodeSize * 0.3}`)
            .attr('fill', svgStyle.linkStroke)

        nodes.forEach(d => {
            if (findObjInArr(d.group, "name", curTriple.sourceEntity) !== null) {
                d.fx = 100
                d.fy = this.svgHeight / 2

            } else if (findObjInArr(d.group, "name", curTriple.targetEntity) !== null) {
                d.fx = this.svgWidth - 100
                d.fy = this.svgHeight / 2
            }
        })

        let node = this.nodeGroup.selectAll("g").data(nodes, d => d.id);

        node.exit().remove()

        let nodeEnter = node.enter()
            .append('g')
            .attr("id", d => `node${d.id}`)
            .call(this.drag(this.simulation))


        nodeEnter.append("circle")
            .attr("class", "node")

        let _this = this

        nodeEnter
            .filter(d => d.group.length === 1)
            .append("text")
            .attr("class", "node-text")
            .attr("dy", forceSet.nodeSize * 2)
            .style("visibility", d => {
                if (findObjInArr(d.group, "name", curTriple.sourceEntity) !== null) {
                    return 'visible'
                } else if (findObjInArr(d.group, "name", curTriple.targetEntity) !== null) {
                    return 'visible'
                } else {
                    return switchSet.showNodeText ? 'visible' : 'hidden'
                }
            })
            .style('fill', "black")
            .attr("font-size", svgStyle.nodeLabelSize)
            .attr("dx", 0)
            .attr("text-anchor", "middle")
            .text(d => splitNodeName(d.group[0].name))
            .on('mouseover', function (e, d) {
                d3.select(this)
                    .text(d.group[0].name)
            })
            .on('mouseout', function (e, d) {
                d3.select(this)
                    .text(splitNodeName(d.group[0].name))
            })

        this.updateNode = nodeEnter.merge(node)

        this.updateNode.select('.node')
            .attr("r", d => d.group.length > 1 ? Math.ceil(Math.sqrt(d.group.length) + 2) * forceSet.nodeSize : forceSet.nodeSize)
            .style("fill", d => {
                if (findObjInArr(d.group, "name", curTriple.sourceEntity) !== null) {
                    return svgStyle.sourceNodeColor
                } else if (findObjInArr(d.group, "name", curTriple.targetEntity) !== null) {
                    return svgStyle.targetNodeColor
                } else if (d.group.length > 1) {
                    return "#ece6e6"
                } else {
                    return svgStyle.nodeColor
                }
            })
            .style("stroke", d => {
                if (findObjInArr(d.group, "name", curTriple.sourceEntity) !== null) {
                    return svgStyle.sourceNodeStroke
                } else if (findObjInArr(d.group, "name", curTriple.targetEntity) !== null) {
                    return svgStyle.targetNodeStroke
                } else {
                    return svgStyle.nodeStroke
                }
            })
            .style("stroke-width", 1)

        // 添加聚合组节点
        this.updateNode
            .filter(d => d.group.length > 1)
            .append('g')
            .attr('id', d => `container${d.id}`)
            .each(function (d) {
                let simulation = d3.forceSimulation();
                let width = Math.ceil(Math.sqrt(d.group.length) + 2) * forceSet.nodeSize * 2,
                    height = width;
                // 建立内置布局
                _this.buildForces(simulation, width, height)

                _this.updateForces(simulation, d.group, [], {
                    bodyStrength: -130,
                    linkDistance: 10,
                    nodeSize: 8,
                    forceX: 1,
                    forceY: 1
                });
                let group = d3.select(this).selectAll("g").data(d.group, d => d.id);
                let groupEnter = group.enter()
                    .append('g')
                    .attr("id", d => `node${d.id}`)
                    .call(_this.drag(simulation))
                    .on('mouseover', function (e, d) {
                        d3.select(this)
                            .select('.node-text')
                            .style("visibility", 'visible')
                    })
                    .on('mouseout', function (e, d) {
                        d3.select(this)
                            .select('.node-text')
                            .style("visibility", 'hidden')
                    })

                groupEnter.append("circle")
                    .attr("class", "node")
                    .attr("r", forceSet.nodeSize)
                    .style("fill", svgStyle.nodeColor)
                    .style("stroke", svgStyle.nodeStroke)
                    .style("stroke-width", 1)

                groupEnter
                    .append("text")
                    .attr("class", "node-text")
                    .attr("dy", forceSet.nodeSize * 2)
                    .style("visibility", 'hidden')
                    .style('fill', "black")
                    .attr("font-size", svgStyle.nodeLabelSize)
                    .attr("dx", 0)
                    .attr("text-anchor", "middle")
                    .text(d => d.name)

                _this.nodeGroupForceDragTick(simulation, groupEnter, forceSet.nodeSize, width, height);
            })

        let linkText = this.linkTextGroup.selectAll("text.link-text").data(links, d => d.id);

        linkText.exit().remove();

        let linkTextEnter = linkText.enter()
            .append("text")

        linkTextEnter
            .attr("class", "link-text")
            .attr("id", d => `linkText${d.id}`)
            .attr("font-size", svgStyle.linkLabelSize)
            .style("visibility", switchSet.showLinkText ? 'visible' : 'hidden')
            .style('fill', "#9d9b9b")
            .attr("text-anchor", "middle")
            .text(d => splitLinkName(d.name))

        this.updateLinkText = linkTextEnter.merge(linkText)
            .attr("dy", d => d.linknum ? 3 + d.linknum * 20 : -3 + d.linknum * 20)

    }
    updateKgDisplay = () => {
        const { svgStyle, forceSet, switchSet } = this.state

        this.updateLink
            .style("stroke-width", svgStyle.linkWidth)

        this.marker
            .attr("viewBox", `0 ${-forceSet.nodeSize * 0.3} ${forceSet.nodeSize * 0.6} ${forceSet.nodeSize * 0.6}`)
            .attr("refX", d => forceSet.nodeSize * 0.6)
            .attr("markerWidth", forceSet.nodeSize * 0.6)
            .attr("markerHeight", forceSet.nodeSize * 0.6)

        this.markerPath
            .attr("d", `M0,${-forceSet.nodeSize * 0.3} L${forceSet.nodeSize * 0.6},0 L0,${forceSet.nodeSize * 0.3}`)
            .attr('fill', svgStyle.linkStroke)

        this.updateNode
            .select('.node')
            .attr("r", d => d.group.length > 1 ? Math.ceil(Math.sqrt(d.group.length) + 2) * forceSet.nodeSize : forceSet.nodeSize)

        this.updateNode
            .filter(d => d.group.length === 1)
            .select('.node-text')
            .style("visibility", switchSet.showNodeText ? 'visible' : 'hidden')
            .attr("font-size", svgStyle.nodeLabelSize)

        this.updateLinkText
            .attr("dy", -3 - svgStyle.linkWidth)
            .attr("font-size", svgStyle.linkLabelSize)
            .style("visibility", switchSet.showLinkText ? 'visible' : 'hidden')

    }
    updateDragTick(simulation) {
        const { forceSet } = this.state;
        const { curTriple } = this.props;
        simulation.on('tick', () => {
            // 节点显示位置
            this.updateNode
                .attr('transform', (d) => {

                    if (findObjInArr(d.group, "name", curTriple.sourceEntity) !== null) {
                        d.fx = 100
                        d.fy = this.svgHeight / 2

                    } else if (findObjInArr(d.group, "name", curTriple.targetEntity) !== null) {
                        d.fx = this.svgWidth - 100
                        d.fy = this.svgHeight / 2
                    }
                    return `translate(${d.x.toFixed(2)},${d.y.toFixed(2)})`
                });
            this.updateLink
                .attr('d', d => {
                    if (d.type === "self") {
                        /*
                            left_x 圆左上角的点x轴值
                            right_x 圆右上角的点x轴值
                            y  圆左上角的y轴值
                        */
                        const left_x = d.source.x - Math.sin(2 * Math.PI / 360 * 60) * forceSet.nodeSize,
                            right_x = d.source.x + Math.sin(2 * Math.PI / 360 * 60) * forceSet.nodeSize,
                            y = d.source.y - Math.cos(2 * Math.PI / 360 * 60) * forceSet.nodeSize;
                        return `M${left_x.toFixed(2)},${y.toFixed(2)} C${(left_x - 20).toFixed(2)},${(y - forceSet.nodeSize * 5).toFixed(2)} ${(right_x + 20).toFixed(2)},${(y - forceSet.nodeSize * 5).toFixed(2)} ${right_x.toFixed(2)},${y.toFixed(2)}`
                    } else {
                        let radian = Math.atan((d.target.y - d.source.y) / (d.target.x - d.source.x)),
                            angle = Math.floor(180 / (Math.PI / radian));

                        let target_r = d.target.group.length > 1 ? Math.ceil(Math.sqrt(d.target.group.length) + 2) * forceSet.nodeSize : forceSet.nodeSize,
                            source_r = d.source.group.length > 1 ? Math.ceil(Math.sqrt(d.source.group.length) + 2) * forceSet.nodeSize : forceSet.nodeSize
                        // 计算360度圆的对应度数
                        let source_degree = d.target.x - d.source.x < 0 ? angle + 180 : angle,
                            target_degree = d.target.x - d.source.x > 0 ? angle + 180 : angle
                        // 计算目标节点上的坐标
                        let source_x = d.source.x + Math.cos(Math.PI * 2 / 360 * source_degree) * source_r,
                            source_y = d.source.y + Math.sin(Math.PI * 2 / 360 * source_degree) * source_r,
                            target_x = d.target.x + Math.cos(Math.PI * 2 / 360 * target_degree) * target_r,
                            target_y = d.target.y + Math.sin(Math.PI * 2 / 360 * target_degree) * target_r;
                        /*  4个象限取值:
                            cos为负sin+  ++
                            ++           cos为负sin+
                        */
                        let bevelEdge = Math.sqrt(Math.pow(target_x - source_x, 2) + Math.pow(target_y - source_y, 2)),
                            rotateAngleCos = (target_x - source_x) / bevelEdge,
                            rotateAngleSin = (source_y - target_y) / bevelEdge;

                        if (target_y < source_y && target_x > source_x) {
                            rotateAngleCos = -rotateAngleCos
                            rotateAngleSin = -rotateAngleSin
                        } else if (target_y < source_y && target_x < source_x) {
                            rotateAngleCos = -rotateAngleCos
                            rotateAngleSin = -rotateAngleSin
                        }
                        const leftBendDistance = ((source_x + target_x) / 2 + rotateAngleSin * d.linknum * 20).toFixed(2),
                            rightBendDistance = ((source_y + target_y) / 2 + rotateAngleCos * d.linknum * 20).toFixed(2)

                        return `M${source_x.toFixed(2)},${source_y.toFixed(2)} Q${leftBendDistance},${rightBendDistance} ${target_x.toFixed(2)},${target_y.toFixed(2)}`
                    }
                })


            this.updateLinkText
                .attr('transform', (d) => {
                    if (d.type === "self") {
                        return `translate(${((d.source.x + d.target.x) / 2).toFixed(2)},${((d.source.y + d.target.y) / 2 - forceSet.nodeSize * 5).toFixed(2)})`
                    } else {
                        let radian = Math.atan((d.target.y - d.source.y) / (d.target.x - d.source.x)),
                            angle = Math.floor(180 / (Math.PI / radian));

                        let target_r = d.target.group.length > 1 ? Math.ceil(Math.sqrt(d.target.group.length) + 2) * forceSet.nodeSize : forceSet.nodeSize,
                            source_r = d.source.group.length > 1 ? Math.ceil(Math.sqrt(d.source.group.length) + 2) * forceSet.nodeSize : forceSet.nodeSize
                        // 计算360度圆的对应度数
                        let source_degree = d.target.x - d.source.x < 0 ? angle + 180 : angle,
                            target_degree = d.target.x - d.source.x > 0 ? angle + 180 : angle
                        // 计算目标节点上的坐标
                        let source_x = d.source.x + Math.cos(Math.PI * 2 / 360 * source_degree) * source_r,
                            source_y = d.source.y + Math.sin(Math.PI * 2 / 360 * source_degree) * source_r,
                            target_x = d.target.x + Math.cos(Math.PI * 2 / 360 * target_degree) * target_r,
                            target_y = d.target.y + Math.sin(Math.PI * 2 / 360 * target_degree) * target_r;
                        return `translate(${((source_x + target_x) / 2).toFixed(2)},${((source_y + target_y) / 2 + d.linknum * 5).toFixed(2)}) rotate(${angle})`

                    }
                });

            if (simulation.alpha() < simulation.alphaMin()) {
                // 拖拽时不缩放
                if (this.state.switchSet.autoZoomFlag) {
                    this.autoZoom() // 自适应缩放
                }
            }
        });
        this.firstUpdate(simulation)

    }
    autoZoom() {
        const viewBox = this.svg.node().getBBox(),
            transform = d3.zoomTransform(this.svg.node()),
            pre_scale = transform.k;

        if (viewBox.width > this.svgWidth || viewBox.height > this.svgHeight) {
            const next_scale = Math.min((this.svgWidth - 50) / viewBox.width, (this.svgHeight - 50) / viewBox.height),
                center_x = this.svgWidth / 2 - (viewBox.x + viewBox.width / 2 - transform.x) / pre_scale * next_scale,
                center_y = this.svgHeight / 2 - (viewBox.y + viewBox.height / 2 - transform.y) / pre_scale * next_scale;

            const t = d3.zoomIdentity.translate(center_x, center_y).scale(next_scale);
            this.svg.transition().duration(750).call(this.zoom.transform, t)
        }
    }
    nodeGroupForceDragTick(simulation, nodes, nodeSize, width, height) {
        simulation.on('tick', () => {
            // 节点显示位置
            nodes
                .attr('transform', (d) => {
                    let x = d.x - width / 2,
                        y = d.y - height / 2;
                    let dis = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
                    if (dis > width / 2 - nodeSize) {
                        let radian = Math.atan(y / x),
                            degree = Math.floor(180 / (Math.PI / radian));
                        if (x < 0) degree += 180 // 计算360度的圆上坐标
                        let _x = Math.cos(Math.PI * 2 / 360 * degree) * (width / 2 - nodeSize),
                            _y = Math.sin(Math.PI * 2 / 360 * degree) * (height / 2 - nodeSize);
                        return `translate(${_x},${_y})`
                    } else {
                        return `translate(${x},${y})`
                    }

                });
        });
        this.firstUpdate(simulation)
    }
    //第一轮迭代，大概120次
    firstUpdate(simulation) {
        while (simulation.alpha() > simulation.alphaMin()) {
            simulation.tick();
        }
    }
    zoomed = (event) => {
        this.svg_kg.attr(
            "transform",
            `translate(${event.transform.x.toFixed(4)},${event.transform.y.toFixed(4)}) 
            scale(${event.transform.k.toFixed(4)})`
        );
    }
    // 拖拽
    drag(simulation) {
        let _this = this

        function dragstarted(event, d) {
            _this.setState({ switchSet: Object.assign({}, _this.state.switchSet, { autoZoomFlag: false }) })
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; // fx固定节点
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = d.x; // fx固定节点
            d.fy = d.y;
        }

        return d3
            .drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
    handleSvgClick = (e) => {
        // if (e.target.nodeName === "svg") {
        //     this.clearSvg()
        // }
    }
    clearSvg() {
        const { svgStyle } = this.state
        const { curTriple } = this.props
        this.updateLink
            .style("stroke", svgStyle.linkStroke)
            .style("stroke-width", svgStyle.linkWidth)

        this.updateNode
            .select('.node')
            .style("fill", d => {
                if (d.name === curTriple.sourceEntity) {
                    return svgStyle.sourceNodeColor
                } else if (d.name === curTriple.targetEntity) {
                    return svgStyle.targetNodeColor
                } else {
                    return svgStyle.nodeColor
                }
            })
    }
    pathForward(action, wait) {
        const { svgStyle } = this.state

        return new Promise(resolve => {
            d3.select(`#link${action.link_id}`)
                .style("stroke", "yellow")
                .style("stroke-width", svgStyle.linkWidth * 3)
            d3.select(`#node${action.et_id}`)
                .select('.node')
                .style("fill", "green")
            setTimeout(resolve, wait)
        })
    }
    handleHightLightPath(predictionFlag, prediction_link, existNodes, existLinks, colors, pathStatsList) {
        const { entitys } = this.props
        this.clearSvg()
        // 添加预测的头尾实体间的边
        let _links = [...this.props.kgData.links],
            _prediction_link = {
                'id': `${entitys[prediction_link.es_name].type_id}-${prediction_link.rel_id}-${entitys[prediction_link.et_name].type_id}`,
                'name': prediction_link.name,
                'rel_id': prediction_link.rel_id,
                'source': entitys[prediction_link.es_name].type_id,
                'target': entitys[prediction_link.et_name].type_id,
                'es_name': prediction_link.es_name,
                'et_name': prediction_link.et_name,
            }
        _links.push(_prediction_link)
        if (predictionFlag) {
            this.setState({ links: _links }, () => {
                const { svgStyle } = this.state
                this.updateNode
                    .each(function (d) {
                        let node_dom = d3.select(this)
                        if (!(d.id === entitys[prediction_link.es_name].type_id || d.id === entitys[prediction_link.et_name].type_id)) {
                            const find_path_index = (name) => {
                                for (let key in existNodes) {
                                    if (existNodes[key].includes(name)) {
                                        return key
                                    } else {
                                        return null
                                    }
                                }
                            }
                            let path_idx = findObjInArr(pathStatsList, "path", find_path_index(d.group[0].name))
                            if (path_idx !== null) {
                                if (d.group.length === 1) {
                                    // 高亮非聚合节点
                                    node_dom.select('.node')
                                        .style("fill", colors[path_idx])
                                        .style("opacity", "1")
                                    node_dom.select('.node-text')
                                        .style("visibility", 'visible')

                                } else {
                                    // 高亮聚合节点
                                    node_dom.select('.node')
                                        .style("opacity", "1")
                                    node_dom.select(`#container${d.id}`)
                                        .selectAll('g')
                                        .select('.node')
                                        .style("fill", colors[path_idx])
                                }
                            } else {
                                node_dom.select('.node')
                                    .style("opacity", "0.3")
                                node_dom.select('.node-text')
                                    .style("visibility", 'hidden')
                                if (d.group.length > 1) {
                                    node_dom.select(`#container${d.id}`)
                                        .selectAll('g')
                                        .select('.node')
                                        .style("opacity", "0.3")
                                }
                            }
                        }

                    })
                // 高亮路径
                this.updateLink
                    .filter(d => d.id !== _prediction_link.id)
                    .style("stroke-opacity", "0.2")
                this.updateLinkText
                    .style("visibility", 'hidden')
                // 路径置信度归一化
                let maxWeight = Math.max(...pathStatsList.map(v => v.weight))
                const normal = (weight) => {
                    let a = 2 / (maxWeight - 1),
                        b = 1 - a
                    return a * weight + b
                }
                // 高亮路径边
                for (let key in existLinks) {
                    let path_idx = findObjInArr(pathStatsList, "path", key)
                    existLinks[key].forEach(link => {
                        link = JSON.parse(link)
                        let link_id = `${entitys[link.es_name].type_id}-${link.rel_id}-${entitys[link.et_name].type_id}`
                        this.linkGroup.select(`#link${link_id}`)
                            .style("stroke", colors[path_idx])
                            .style("stroke-opacity", "1")
                            .style("stroke-width", normal(pathStatsList[path_idx].weight).toFixed(1))
                        this.linkTextGroup.select(`#linkText${link_id}`)
                            .style("visibility", 'visible')

                    })
                }
                // 高亮预测边
                this.linkGroup.select(`#link${_prediction_link.id}`)
                    .style("stroke", "green")
                    .style("stroke-width", svgStyle.linkWidth * 2)
                    .style("stroke-Dasharray", "4 2")
                this.linkTextGroup.select(`#linkText${_prediction_link.id}`)
                    .style("visibility", 'visible')
            })

        } else {
            this.setState({ links: _links }, () => {
                const { svgStyle } = this.state
                this.linkGroup.select(`#link${_prediction_link.id}`)
                    .style("stroke", "black")
                    .style("stroke-width", svgStyle.linkWidth * 2)
                    .style("stroke-Dasharray", "4 2")
                this.linkTextGroup.select(`#linkText${_prediction_link.id}`)
                    .style("visibility", 'visible')
            })
        }

    }
    handleKgSettingChange = (set, setType) => {
        // 控制面板回参
        switch (setType) {
            case 'forceSet':
                const forceSet = { ...this.state.forceSet }
                this.setState({ forceSet: Object.assign({}, forceSet, { [set.forceSetType]: set.value }) })
                break;
            case 'svgStyle':
                const svgStyle = { ...this.state.svgStyle }
                this.setState({ svgStyle: Object.assign({}, svgStyle, { [set.svgStyleType]: set.value }) })
                break;
            case 'switchSet':
                const switchSet = { ...this.state.switchSet }
                this.setState({ switchSet: Object.assign({}, switchSet, { [set.switchSetType]: set.value }) })
                if (set.switchSetType === "autoZoomFlag" && set.value) {
                    this.autoZoom()
                }
                break;
            default:
                break;
        }
    }

    render() {
        const { forceSet, svgStyle, switchSet } = this.state;
        return (
            <div ref={this.kgNetwork} className="kg-network" onContextMenu={(e) => e.preventDefault()}>
                <KgSettingPanel
                    onKgSettingChange={this.handleKgSettingChange}
                    forceSet={forceSet}
                    svgStyle={svgStyle}
                    switchSet={switchSet}
                />
            </div>
        );
    }
}




function setDoubleLink(links) {

    const linkGroup = {};
    // 根据link的source和target的id属性，对所有边进行分组
    links.forEach((link) => {
        const key = setLinkName(link);
        if (!linkGroup.hasOwnProperty(key)) {
            linkGroup[key] = [];
        }
        linkGroup[key].push(link);
    });
    // 遍历给每组去调用 setLinkNumbers 来分配 linkum
    links.forEach((link) => {
        const key = setLinkName(link),
            group = linkGroup[key],
            keyPair = key.split(':');
        // 设置自循环标签
        let type = 'noself';
        if (keyPair[0] === keyPair[1]) {
            type = 'self';
        }
        link.type = type
        setLinkNumbers(group);
    });
}
function setLinkNumbers(group) {
    const len = group.length;
    const linksA = []; // 正向link
    const linksB = []; // 反向link

    for (let i = 0; i < len; i++) {
        const link = group[i];
        if (typeof (link.source) === "object" ? link.source.id < link.target.id : link.source < link.target) {
            linksA.push(link);
        } else {
            linksB.push(link);
        }

    }
    // 正向组
    let startLinkANumber = 0;
    for (let i = 0; i < linksA.length; i++) {
        const link = linksA[i];
        if (linksB.length === 0) {
            if (linksA.length > 1) {
                // 1 -1 2 -2 3 -3
                link.linknum = i % 2 === 0 ? (++startLinkANumber) * Math.pow(-1, i) : startLinkANumber * Math.pow(-1, i)
            } else {
                link.linknum = 0
            }
        } else {
            link.linknum = ++startLinkANumber;
        }

    }
    let startLinkBNumber = 0;
    for (let i = 0; i < linksB.length; i++) {
        const link = linksB[i];
        if (linksA.length === 0) {
            if (linksB.length > 1) {
                link.linknum = i % 2 === 0 ? (++startLinkBNumber) * Math.pow(-1, i) : startLinkBNumber * Math.pow(-1, i)
            } else {
                link.linknum = 0
            }
        } else {
            link.linknum = --startLinkBNumber;
        }
    }
}
function setLinkName(link) {
    return typeof (link.source) === "object" ?
        link.source.id < link.target.id
            ? `${link.source.id}:${link.target.id}`
            : `${link.target.id}:${link.source.id}` :
        link.source < link.target
            ? `${link.source}:${link.target}`
            : `${link.target}:${link.source}`
}

export default Kg;