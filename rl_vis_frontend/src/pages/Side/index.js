
import React, { forwardRef } from 'react';
import * as d3 from 'd3'
import axios from '../../assets/http'
import { splitLinkName, splitNodeName } from '../../util/tool'
import { Button, Row, Col, message, List, Divider, Checkbox, Badge, Popover, Dropdown, Menu, Radio } from 'antd';
import VirtualList from 'rc-virtual-list';
import { getSubGraph } from '../../util/tool'
import { DownOutlined } from '@ant-design/icons';
import PathVis from '../../components/Sider/PathVis'
import './index.scss'


class SidePanel extends React.Component {
    constructor(props) {
        super(props);
        this.extraSubGraphs = []
        this.state = {
            pathStatsList: [],
            checkedPathList: [],
            checkAllFlag: false,
            indeterminate: false,
            rankSimilarEntities: [],
            similarEntitiesLoading: false,
            predictionLoading: false,
            subGraphLoading: false,
            dropDownVisible: false,
            sortMethodchecked: "实体相似度",
            sortLoading: false,
            existPaths: {},
            pathDetails: []
        };
    }
    componentDidMount() {

        // this.getPathStats()
    }
    componentDidUpdate(prevProps, prevState) {
        const { curTriple } = this.props;
        if (prevProps.curTriple !== curTriple) {
            this.setState({ existPaths: {} })
            this.getPathStats(curTriple.relation)
        }
    }
    getPathStats(relation) {
        const {onMainStateChange} = this.props
        axios.get("/get_path_stats", {
            params: { task: relation }
        })
            .then(({ data }) => {

                if (data.state === 200 && data.data !== null) {
                    const pathStatsList = data.data,
                        checkedPathList = []
                    let color = d3.scaleLinear()
                        .domain([0, pathStatsList.length - 1])
                        .range(["#0a1fba", "#D3BDEC"])
                        .interpolate(d3.interpolateHcl);

                    pathStatsList.forEach((item, index) => {
                        item.color = color(index)
                        checkedPathList.push(item.path)
                    })
                    this.setState({ pathStatsList, checkedPathList, "pathDetails": pathStatsList })
                    onMainStateChange({
                        pathDetails: pathStatsList
                    })
                }
            })
            .catch(error => {
                message.error("查询推理路径失败！")
            })
    }
    onCheckAllPathStatsChange = e => {
        const { pathStatsList } = this.state
        this.setState({
            checkedPathList: e.target.checked ? pathStatsList.map(item => item.path) : [],
            checkAllFlag: e.target.checked,
            indeterminate: false
        })
    }
    oncheckedPathChange = list => {
        const { pathStatsList } = this.state
        this.setState({
            checkedPathList: list,
            indeterminate: !!list.length && list.length < pathStatsList.length,
            checkAllFlag: list.length === pathStatsList.length
        })
    }
    getSimilarEntities = () => {
        const { curTriple } = this.props
        this.setState({ similarEntitiesLoading: true })
        axios.get("/get_similar_json", {
            params: { sourceEntity: curTriple.sourceEntity }
        })
            .then(({ data }) => {
                if (data.state === 200 && data.data !== null) {
                    this.setState({ rankSimilarEntities: data.data, similarEntitiesLoading: false })
                }
            })
            .catch(error => {
                message.error("查询相似实体失败！")
                this.setState({ similarEntitiesLoading: false })
            })
    }
    handleFactPrediction = () => {
        const { checkedPathList, pathStatsList, pathDetails } = this.state
        const { curTriple, getKgRef, onMainStateChange } = this.props
        this.setState({ predictionLoading: true })
        axios.get("/get_prediction_result", {
            params: { sample: curTriple, path_stats: checkedPathList }
        })
            .then(({ data }) => {
                if (data.state === 200) {

                    const { existPaths, prediction_link, existNodes, existLinks, existPathsDetails } = data.data
                    if (existPaths !== null) {
                        getKgRef.handleHightLightPath(true, prediction_link, existNodes, existLinks, pathStatsList)
                        const checkedPathList = [...Object.keys(existPaths)]
                        pathDetails.forEach(item => {
                            item["details"] = existPathsDetails[item.path]
                        })
                        onMainStateChange({
                            pathDetails: pathStatsList
                        })
                        this.setState({ predictionLoading: false, checkedPathList: checkedPathList, existPaths })
                    } else {
                        getKgRef.handleHightLightPath(false, prediction_link)
                        message.error("无符合的推理路径！")
                        this.setState({ predictionLoading: false, checkedPathList: [] })
                    }

                } else {
                    this.setState({ predictionLoading: false })
                }
            })
            .catch(error => {
                message.error("查询推理路径失败！")
                this.setState({ predictionLoading: false })
            })
    }
    handleSubGraphLoad = (entityName) => {
        const { curTriple, getExtrakgRefs, onMainStateChange } = this.props;
        if (!getExtrakgRefs[entityName]) {
            let triple = {
                sourceEntity: entityName,
                relation: curTriple.relation,
                targetEntity: curTriple.targetEntity
            }
            this.setState({ subGraphLoading: true })
            getSubGraph(triple, 3).then(value => {
                if (value) {
                    this.extraSubGraphs.push({ "simTriple": triple, "kgData": value })
                    onMainStateChange({
                        extraSubGraphs: this.extraSubGraphs
                    })
                    this.setState({ subGraphLoading: false })
                }
            }).catch(error => {
                message.error(error.message)
                this.setState({ subGraphLoading: false })
            })
        } else {
            message.error("子图已加载！")
        }

    }
    handleSubGraphStatsPath = (entityName) => {
        const { pathStatsList } = this.state
        const { curTriple, getExtrakgRefs } = this.props
        if (getExtrakgRefs[entityName]) {
            let triple = {
                sourceEntity: entityName,
                relation: curTriple.relation,
                targetEntity: curTriple.targetEntity
            }
            this.setState({ predictionLoading: true })
            axios.get("/get_prediction_result", {
                params: { sample: triple, path_stats: pathStatsList.map(item => item.path) }
            })
                .then(({ data }) => {
                    if (data.state === 200) {
                        const { existPathNodes, existPathLinks } = data.data
                        if (existPathNodes !== null) {
                            getExtrakgRefs[entityName].handleHightLightPath(existPathNodes, existPathLinks)
                            this.setState({ predictionLoading: false })
                        } else {
                            message.error("无符合的推理路径！")
                            this.setState({ predictionLoading: false })
                        }
                    }
                })
                .catch(error => {
                    message.error("查询推理路径失败！")
                    this.setState({ predictionLoading: false })
                })
        } else {
            message.error("未加载子图！")
        }

    }
    handleSubGrpahSupportSort = (e) => {
        const { pathStatsList, rankSimilarEntities } = this.state
        const { curTriple } = this.props
        this.setState({ dropDownVisible: true, sortLoading: true })
        axios.get("/get_subgraph_support_sort", {
            params: {
                entities: rankSimilarEntities.map(entity => entity.entityName),
                path_stats: pathStatsList,
                relation: curTriple.relation,
                targetEntity: curTriple.targetEntity
            }
        })
            .then(({ data }) => {
                if (data.state === 200) {
                    this.setState({ rankSimilarEntities: data.data, sortLoading: false })
                }
            })
            .catch(error => {
                message.error("排序失败！")
                this.setState({ sortLoading: false })
            })
    };
    handleSort = e => {
        const { sortMethodchecked } = this.state
        switch (sortMethodchecked) {
            case "实体相似度":

                break;
            case "子图支持度":
                this.handleSubGrpahSupportSort()
                break;
            case "推理路径覆盖率":

                break;
            case "联合排序":

                break;
            default:
                break;
        }
    }
    handleCheckSortMethod = (e) => {
        this.setState({ dropDownVisible: true, sortMethodchecked: e.target.value })
    }
    handleDropDownVisibleChange = (flag) => {
        this.setState({ dropDownVisible: flag })
    }
    showDrawer=() =>{
        this.props.onMainStateChange({drawerVisible: true})
    }
    render() {
        const { pathStatsList, checkedPathList, rankSimilarEntities, similarEntitiesLoading, checkAllFlag, indeterminate, predictionLoading, subGraphLoading, dropDownVisible, sortMethodchecked, sortLoading, existPaths } = this.state
        const menu = (
            <List
                size="small"
                loadMore={
                    <div
                        style={{
                            margin: '6px 0',
                            textAlign: 'center',
                        }}
                    >
                        <Button size='small' onClick={this.handleSort} loading={sortLoading} >
                            排序
                        </Button>
                    </div>
                }>

                <List.Item style={{ padding: 0 }}>
                    <Radio.Group onChange={this.handleCheckSortMethod} value={sortMethodchecked} >
                        <Menu>
                            <Menu.Item key='0' style={{ margin: 0 }}>
                                <Radio value="实体相似度" >实体相似度</Radio>
                            </Menu.Item>
                            <Menu.Item key='1' style={{ margin: 0 }}>
                                <Radio value="子图支持度" >子图支持度</Radio>
                            </Menu.Item>
                            <Menu.Item key='2' style={{ margin: 0 }}>
                                <Radio value="推理路径覆盖率" >推理路径覆盖率</Radio>
                            </Menu.Item>
                            <Menu.Item key='3' style={{ margin: 0 }}>
                                <Radio value="联合排序" >联合排序</Radio>
                            </Menu.Item>
                            <Menu.Divider></Menu.Divider>
                        </Menu>
                    </Radio.Group>
                </List.Item>


            </List>

        );
        return (
            <div className="rl-view-sider">
                <Divider orientation="left">推理路径
                <Button style={{position:"absolute", right:"20px"}} onClick={this.showDrawer}>查看预测详情</Button>
                </Divider>
                
                <List
                    header={
                        <div style={{ display: "flex", justifyContent: "space-between" }} >
                            <Checkbox indeterminate={indeterminate} onChange={this.onCheckAllPathStatsChange} checked={checkAllFlag} >
                                全选
                            </Checkbox>
                            <Button onClick={this.handleFactPrediction} loading={predictionLoading}>
                                执行预测
                            </Button>
                            <span>置信度</span>
                            <span>命中条数</span>
                        </div>
                    }
                    bordered
                >
                    <Checkbox.Group style={{ width: '100%' }} onChange={this.oncheckedPathChange} value={checkedPathList}  >
                        <VirtualList
                            data={pathStatsList}
                            height={500}
                            itemKey="path"

                        >
                            {(item, index) => {
                                return (
                                    <List.Item style={{ width: '100%', wordBreak: 'break-word' }}
                                        actions={[
                                            <Badge count={item.weight} style={{ backgroundColor: item.color }} />,
                                            <div className='badge-hitpath'>{existPaths[item.path] ? existPaths[item.path] : 0}</div>
                                        ]}
                                    >
                                        <Checkbox value={item.path}></Checkbox>
                                        <Popover
                                            placement="right"
                                            title={<span style={{ fontSize: "16px" }}>证据信息(来源RL训练集)</span>}
                                            content={<PathVis path={item.path} />}
                                            trigger="click"
                                        >
                                            <span style={{ padding: "0 8px" }}>{item.path}</span>
                                        </Popover>

                                    </List.Item>
                                )
                            }}

                        </VirtualList>
                    </Checkbox.Group>
                </List >
                {/* <Divider orientation="left">辅助信息</Divider>
                <List
                    header={
                        <div style={{ display: "flex", justifyContent: "center" }} >
                            <Dropdown.Button
                                icon={<DownOutlined />}
                                loading={similarEntitiesLoading}
                                overlay={menu}
                                onClick={this.getSimilarEntities}
                                onVisibleChange={this.handleDropDownVisibleChange}
                                visible={dropDownVisible}
                            >
                                查询相似实体
                            </Dropdown.Button>

                        </div>
                    }
                    bordered
                >
                    <VirtualList
                        data={rankSimilarEntities}
                        height={400}
                        itemKey="entityName"
                    >
                        {(item, index) => {
                            return (
                                <List.Item style={{ width: '100%' }}
                                    extra={
                                        <Badge count={item.score} />
                                    }
                                >
                                    <label>{index + 1}. </label>
                                    <Popover
                                        placement="right"
                                        content={
                                            <>
                                                <Button onClick={() => this.handleSubGraphLoad(item.entityName)} loading={subGraphLoading}>
                                                    加载子图
                                                </Button>
                                                <Button onClick={() => this.handleSubGraphStatsPath(item.entityName)} loading={predictionLoading}>
                                                    显示推理路径
                                                </Button>
                                            </>}
                                        trigger="click">
                                        <span style={{ wordBreak: 'break-word', marginLeft: '5px' }}  >{item.entityName}</span>
                                    </Popover>

                                </List.Item>
                            )
                        }}

                    </VirtualList>
                </List> */}
            </div >
        );
    }
}
export default SidePanel;
