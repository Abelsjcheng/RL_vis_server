
import React, { forwardRef } from 'react';
import axios from '../../assets/http'
import { splitLinkName, splitNodeName } from '../../util/tool'
import { Button, Row, Col, message, List, Divider, Checkbox, Badge } from 'antd';
import VirtualList from 'rc-virtual-list';
import './index.scss'

class SidePanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pathStatsList: [],
            checkedPathList: [],
            checkAllFlag: false,
            indeterminate: false,
            rankSimilarEntities: [],
            similarEntitiesLoading: false,
            predictionLoading: false,
        };
    }
    componentDidMount() {
        // this.getPathStats()
    }
    componentDidUpdate(prevProps, prevState) {
        const { curTriple } = this.props;
        if (prevProps.curTriple !== curTriple) {
            this.getPathStats(curTriple.relation)
        }

    }
    getPathStats(relation) {
        axios.get("/get_path_stats", {
            params: { task: relation }
        })
            .then(({ data }) => {

                if (data.state === 200 && data.data !== null) {
                    const pathStatsList = data.data,
                        checkedPathList = []
                    pathStatsList.forEach(item => {
                        if (item.weight > 2) {
                            checkedPathList.push(item.path)
                        }
                    })
                    this.setState({ pathStatsList, checkedPathList })
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
                message.error("查询推理路径失败！")
                this.setState({ similarEntitiesLoading: false })
            })
    }
    handleFactPrediction = () => {
        const { checkedPathList } = this.state
        const { curTriple, getKgRef } = this.props
        this.setState({ predictionLoading: true })
        axios.get("/get_prediction_result", {
            params: { sample: curTriple, path_stats: checkedPathList }
        })
            .then(({ data }) => {
                if (data.state === 200 && data.data !== null) {
                    const {existPathNodes, existPathLinks, existPathIdx} = data.data
                    getKgRef.handleHightLightPath(existPathNodes, existPathLinks)
                    const existPath = existPathIdx.map(id => checkedPathList[id])
                    this.setState({ predictionLoading: false, checkedPathList: existPath  })
                }
            })
            .catch(error => {
                message.error("查询推理路径失败！")
                this.setState({ predictionLoading: false })
            })
    }
    render() {
        const { pathStatsList, checkedPathList, rankSimilarEntities, similarEntitiesLoading, checkAllFlag, indeterminate, predictionLoading } = this.state
        return (
            <div className="rl-view-sider">
                <Divider orientation="left">推理路径</Divider>
                <List
                    header={
                        <div style={{ display: "flex", justifyContent: "space-between" }} >
                            <Checkbox indeterminate={indeterminate} onChange={this.onCheckAllPathStatsChange} checked={checkAllFlag} >
                                全选
                            </Checkbox>
                            <Button onClick={this.handleFactPrediction} loading={predictionLoading}>
                                执行预测
                            </Button>
                        </div>
                    }
                    bordered
                >
                    <Checkbox.Group style={{ width: '100%' }} onChange={this.oncheckedPathChange} value={checkedPathList}  >
                        <VirtualList
                            data={pathStatsList}
                            height={400}
                            itemKey="path"

                        >
                            {item => (
                                <List.Item style={{ width: '100%', wordBreak: 'break-word' }}
                                    extra={
                                        <Badge count={item.weight} />
                                    }
                                >
                                    <Checkbox value={item.path}>{item.path}</Checkbox>

                                </List.Item>
                            )}

                        </VirtualList>
                    </Checkbox.Group>
                </List>
                <Divider orientation="left">辅助信息</Divider>
                <List
                    header={
                        <div style={{ display: "flex", justifyContent: "space-between" }} >
                            <Button onClick={this.getSimilarEntities} loading={similarEntitiesLoading}>
                                查询相似实体
                            </Button>
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
                                        <Badge count={item.similarity} />
                                    }
                                >
                                    <label>{index + 1}. </label>
                                    <span style={{ wordBreak: 'break-word', marginLeft: '5px' }}>{item.entityName}</span>
                                </List.Item>
                            )
                        }}

                    </VirtualList>
                </List>
            </div>
        );
    }
}

export default SidePanel;
