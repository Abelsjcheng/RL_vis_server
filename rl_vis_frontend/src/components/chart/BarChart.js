import React from 'react';
import ReactDOM from 'react-dom';
import * as echarts from 'echarts';
import relation from '../../case/relation.json'
import { Slider, Row, Col } from 'antd';

class BarChart extends React.Component {
    constructor(props) {
        super(props);
        // this.nodes = rebuild(props.nodes, 'node')
        // this.links = rebuild(props.links, 'link')
        // this.e_space = getNextEntity(props.step.next_e_space)
        // this.r_space = getNextRelation(props.step.next_r_space)
        // this.action_prob = getActionProb(props.step, this.e_space, this.r_space)
        // this.step = props.step
        this.state = {

        }
    }
    componentDidMount() {
        this.initCalendarChart()
    }
    componentWillReceiveProps(nextProps) {
        this.initCalendarChart()
    }
    initCalendarChart() {
        const { evidence, relationName } = this.props
        console.log(evidence);
        const chartDom = ReactDOM.findDOMNode(this);
        let chart = echarts.init(chartDom);
        let probs_array = evidence.action_probs_array[evidence.chosen_r_name_array.indexOf(relationName)]
        let data = [['score', 'probability', 'relation']]
        probs_array.forEach((prob, index) => {
            data.push([prob, prob, relation[index]])
        })
        chart.setOption({
            dataset: {
                source: data
            },
            grid: {
                height: '70%',
                left: '20%',
                right: '15%',
                top: '5%'
            },
            xAxis: { name: 'probability' },
            yAxis: { 
                type: 'category',
                splitArea: {
                    show: true
                }
            },
            tooltip: {
                position: 'top',
                formatter: function (info) {
                    let res = `关系:${info.data[2]}<br/>关系选择概率:${info.data[0]}`
                    return res;
                },
            },
            visualMap: {
                orient: 'horizontal',
                left: 'center',
                min: 0,
                max: 1,
                text: ['High Score', 'Low Score'],
                // Map the score column to color
                dimension: 0,
                precision: 2,
                inRange: {
                    color: ['#0000FF', '#FFFF00', '#FF0000']
                }
            },
            series: [
                {
                    type: 'bar',
                    encode: {
                        // Map the "amount" column to X axis.
                        x: 'probability',
                        // Map the "product" column to Y axis
                        y: 'relation'
                    }
                }
            ]
        });
        chart.dispatchAction({
            type: 'highlight',
            seriesIndex: 0,
            dataIndex: relation.indexOf(relationName)+1
        });
    }
    render() {
        return (
            <div style={{ width: 500, height: 270 }}></div>
        );
    }
}


export default BarChart;