import React from 'react';
import ReactDOM from 'react-dom';
import { Timeline, Popover, Card, Select } from 'antd';
import { DownCircleOutlined } from '@ant-design/icons';
import BarChart from '../../chart/BarChart'
import test_aciton_probs from '../../../case/test_aciton_probs.json'
const { Option } = Select;
class RLInfoVis extends React.Component {
    constructor(props) {
        super(props);
        this.evidenceData = buildEvidenceData(props.path)
        const evidenceName = Object.keys(this.evidenceData)[0]
        this.state = {
            evidenceName: evidenceName,
            evidence: this.evidenceData[evidenceName]
        }
    }
    componentDidMount() {
    }
    handleChange(value) {
        this.setState({ evidenceName: value, evidence: this.evidenceData[value] })
    }
    render() {
        const { evidenceName, evidence } = this.state
        const dataSetOptions = Object.values(this.evidenceData).map(d => <Option key={d.triple.join(',')} value={d.triple.join(',')} title={`(${d.triple.join(',')})`}>{d.triple[0]}</Option>);
        let steps = []
        evidence.chosen_r_name_array.forEach((rel, index) => {
            steps.push(rel)
            if (evidence.chosen_e_name_array[index] !== "None") {
                steps.push(evidence.chosen_e_name_array[index])
            }
        })
        return (
            <Card
                size="small"
                title={
                    <Select defaultValue={evidenceName} value={evidenceName} style={{ width: 250 }} onChange={value => this.handleChange(value)}>
                        {dataSetOptions}
                    </Select>
                }
                style={{ width: 300 }}>
                <Timeline mode="alternate">
                    <Timeline.Item >{evidence.test_head}</Timeline.Item>
                    {
                        steps.map((step, index) => {
                            if (index % 2 === 0) {
                                return (
                                    <Popover
                                        placement="rightTop"
                                        title={<span style={{ fontSize: "16px" }}>关系选择概率分布</span>}
                                        content={<BarChart evidence={evidence} relationName={step} />}
                                        trigger="click"
                                        key={evidence.test_head+step}
                                    >
                                        <Timeline.Item  className="timeline-item" dot={<DownCircleOutlined style={{ fontSize: '16px' }} />} >{step}</Timeline.Item>
                                    </Popover>
                                )

                            } else if (index % 2 === 1) {
                                return (
                                    < Timeline.Item key={step} > {step}</Timeline.Item>
                                )

                            }

                        })
                    }
                    <Timeline.Item >{evidence.test_tail}</Timeline.Item>
                </Timeline>
            </Card >

        );
    }
}
function buildEvidenceData(path) {
    let evidenceData = {}
    Object.values(test_aciton_probs).forEach(evidence => {
        if (evidence.chosen_r_name_array.join(' -> ') === path) {
            const triple = [evidence.test_head, evidence.test_relation, evidence.test_tail]
            evidenceData[triple.join(',')] = { ...evidence, "triple": triple }
        }
    })
    return evidenceData
}
export default RLInfoVis;