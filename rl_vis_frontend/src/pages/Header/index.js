
import React from 'react';
import { Select, Row, Col, message, Button } from 'antd';
import axios from '../../assets/http'
import { getSubGraph } from '../../util/tool'
import './index.scss'
const { Option, OptGroup } = Select;
class HeaderPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dataSet: [
                "NELL-995"
            ],
            curDataSet: "NELL-995",
            relationTasks: [
                "concept:athleteplaysinleague",
                "concept:athletehomestadium",
                "concept:athleteplaysforteam",
                "concept:athleteplayssport",
                "concept:organizationheadquarteredincity",
                "concept:organizationhiredperson",
                "concept:personborninlocation",
                "concept:personleadsorganization",
                "concept:teamplaysinleague",
                "concept:teamplayssport",
                "concept:worksfor",
                "concept:agentbelongstoorganization",
            ],
            curTask: "concept:athleteplaysinleague",
            testData: [],
            curTestSample: "concept_personus_kobe_bryant,concept_sportsleague_nba,1",
            curHop: '3',
            subGraphLoading: false,
        };
    }
    componentDidMount() {
        this.handleGetTestData()
        this.handleSubGraphLoad()
    }
    componentDidUpdate(prevProps, prevState) {
        const { curTask } = this.state
        if (curTask !== prevState.curTask) {
            this.handleGetTestData()
        }
    }
    handleChange(value, type) {
        this.setState({ [type]: value })
    }
    handleSubGraphLoad= () => {
        const { curTask, curTestSample, curHop } = this.state
        const { onMainStateChange } = this.props
        const curTestSampleArr = curTestSample.split(',')
        const triple = {
            sourceEntity: curTestSampleArr[0],
            relation: curTask,
            targetEntity: curTestSampleArr[1]
        }
        this.setState({subGraphLoading: true})
        getSubGraph(triple, curHop).then(value => {
            if(value){
                onMainStateChange({
                    curTriple: triple,
                    kgData: value,
                    isLoaded: true,
                    extraSubGraphs: [],
                    extrakgRefs: {}
                })
            }
            this.setState({subGraphLoading: false})
        }).catch(error => {
            message.error(error.message)
            this.setState({subGraphLoading: false})
        })

    }
    handleGetTestData() {
        const { curTask } = this.state;
        axios.get("/get_test_data", {
            params: { task: curTask }
        })
            .then(({ data }) => {
                if (data.data !== null) {
                    this.setState({ testData: data.data })
                }
            })
            .catch(error => {
                message.error("查询数据失败！")
            })
    }
    render() {
        const { dataSet, curDataSet, relationTasks, curTask, testData, curTestSample, curHop, subGraphLoading } = this.state
        const dataSetOptions = dataSet.map(d => <Option key={d}>{d}</Option>);
        const taskOptions = relationTasks.map(d => <Option key={d}>{d}</Option>);
        const positiveOptions = [], negativeOptions = []
        testData.forEach(d => d[2] ? positiveOptions.push(<Option key={d.join(',')} value={d.join(',')} title={`(${d[0]}, ? , ${d[1]})`}>+: {d[0]}</Option>) : negativeOptions.push(<Option key={d.join(',')} value={d.join(',')} title={`(${d[0]}, ? , ${d[1]})`}>-: {d[0]}</Option>))

        return (
            <>
                <Row gutter={[0, 4]} justify="space-between">
                    <Col span={4} >
                        <label className='select-label'>数据集:</label>
                        <Select defaultValue={curDataSet} value={curDataSet} style={{ width: 120 }} onChange={value => this.handleChange(value, "curDataSet")}>
                            {dataSetOptions}
                        </Select>
                    </Col>
                    <Col span={7} >
                        <label className='select-label'>预测任务:</label>
                        <Select defaultValue={curTask} value={curTask} style={{ width: 250 }} onChange={value => this.handleChange(value, "curTask")}>
                            {taskOptions}
                        </Select>
                    </Col>
                    <Col span={7} >
                        <label className='select-label'>测试集:</label>
                        <Select showSearch defaultValue={curTestSample} value={curTestSample} style={{ width: 250 }} onChange={value => this.handleChange(value, "curTestSample")}>
                            <OptGroup label="正样本">
                                {positiveOptions}
                            </OptGroup>
                            <OptGroup label="负样本">
                                {negativeOptions}
                            </OptGroup>
                        </Select>
                    </Col>
                    <Col span={3} >
                        <label className='select-label'>子图大小:</label>
                        <Select defaultValue={curHop} value={curHop} style={{ width: 50 }} onChange={value => this.handleChange(value, "curHop")}>
                            {
                                [1, 2, 3, 4].map(d => <Option key={d}>{d}</Option>)
                            }
                        </Select>
                    </Col>
                    <Col span={2} >
                        <Button type="primary" loading={subGraphLoading} onClick={this.handleSubGraphLoad}>
                            加载子图
                        </Button>
                    </Col>
                </Row>
            </>
        );
    }
}

export default HeaderPanel;
