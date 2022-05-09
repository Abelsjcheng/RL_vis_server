
import React, {forwardRef} from 'react';
import axios from '../../assets/http'
import { splitLinkName, splitNodeName } from '../../util/tool'
import { Button, Row, Col, message, List, Divider, Checkbox,Badge } from 'antd';
import VirtualList from 'rc-virtual-list';
import './index.scss'

class SidePanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pathStats: [],
            checkedPathList: []
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
                    const pathStats = data.data,
                        checkedPathList = []
                    pathStats.forEach(item => {
                        if (item.weight > 2) {
                            checkedPathList.push(item.path)
                        }
                    })
                    this.setState({ pathStats, checkedPathList })
                }
            })
            .catch(error => {
                message.error("查询推理路径失败！")
            })
    }
    render() {
        const { pathStats, checkedPathList } = this.state
        return (
            <div className="rl-view-sider">
                <Divider orientation="left">推理路径</Divider>
                <List
                    header={
                        <Checkbox >
                            全选
                        </Checkbox>
                    }
                    bordered
                >
                    <Checkbox.Group style={{ width: '100%' }} value={checkedPathList} >
                        <VirtualList
                            data={pathStats}
                            height={400}
                            itemKey="path"
                            
                        >
                            {item => (
                                <List.Item style={{width: '100%'}}
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
            </div>
        );
    }
}

export default SidePanel;
