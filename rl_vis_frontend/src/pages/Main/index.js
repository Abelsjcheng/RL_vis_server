
import React from 'react';
import { Spin, message, Layout, Row, Col, Drawer, Button, Space, Collapse, Table, Tag, Input, Radio, Divider  } from 'antd';
import Kg from '../../components/Kg'
import SidePanel from '../Side/index'
import HeaderPanel from '../Header/index'
import PathDetailsTabel from '../../components/PathDetails/tabel/index'
import './index.scss'
const { Header, Content, Sider } = Layout;
const { Panel } = Collapse;

class IndexPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            kgData: null,
            isLoaded: false,
            entitys: null,
            curTriple: null,
            kgRef: null,
            extraSubGraphs: [],
            extrakgRefs: {},
            drawerVisible: false,
            pathDetails: []
        };
    }
    componentDidMount() {

    }
    componentDidUpdate(prevProps, prevState) {

    }
    handelMainStateChange = (nextstates) => {
        this.setState(nextstates)
    }
    onDrawerClose = () => {
        this.setState({ drawerVisible: false })
    }
    render() {
        const { kgData, curTriple, isLoaded, kgRef, entitys, extraSubGraphs, extrakgRefs, drawerVisible, pathDetails } = this.state

        return (
            <div className="App">
                <Layout hasSider>
                    <Sider style={{ background: '#fff', position: 'fixed', left: 0, top: 0, bottom: 0 }} width={340}>
                        <div className='rl-title'>RL关系预测</div>
                        <SidePanel getKgRef={kgRef} getExtrakgRefs={extrakgRefs} kgData={kgData} curTriple={curTriple} onMainStateChange={this.handelMainStateChange}  ></SidePanel>
                    </Sider>
                    <Layout style={{ marginLeft: '340px' }}>
                        <Header
                            style={{
                                width: '100%',
                                backgroundColor: '#fff'
                            }}
                        >
                            <HeaderPanel onMainStateChange={this.handelMainStateChange}></HeaderPanel>
                        </Header>
                        <Content
                            style={{
                                padding: 24,
                                margin: 0,
                                overflow: 'initial',
                                width: '100%',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div
                                className="rl-view-content"
                                style={{
                                    minHeight: 600,
                                }}
                            >
                                {isLoaded ? <Kg onRef={ref => (this.setState({ kgRef: ref }))} kgData={kgData} curTriple={curTriple} entitys={entitys} ></Kg> : <Spin size="large" />}
                                {/* <Row gutter={[4, 4]} justify="space-between">
                                    <Col span={12} className="rl-view-content-graph" >
                                        {isLoaded ? <Kg onRef={ref => (this.setState({ kgRef: ref }))} kgData={kgData} curTriple={curTriple} ></Kg> : <Spin size="large" />}
                                    </Col>
                                    {
                                        extraSubGraphs.map(subGraph => {
                                            return (
                                                <Col key={subGraph.simTriple.sourceEntity} span={12} className="rl-view-content-graph">
                                                    <Kg onRef={ref => (this.setState({ extrakgRefs: {...extrakgRefs, [subGraph.simTriple.sourceEntity]: ref } }))} kgData={subGraph.kgData} curTriple={subGraph.simTriple} ></Kg> 
                                                </Col>
                                            )
                                        })
                                    }
                                </Row> */}

                            </div>
                            <Drawer
                                title="预测结果详情"
                                placement="bottom"
                                width={500}
                                onClose={this.onDrawerClose}
                                visible={drawerVisible}
                                getContainer={false}
                                mask={false}
                                style={{ position: 'absolute' }}
                                extra={
                                    <Space>
                                        <span>当前预测概率: 90%</span>
                                        <Divider type="vertical" />
                                        <label>是否补全当前关系: </label>
                                        <Radio.Group>
                                            <Radio value={true}>Yes</Radio>
                                            <Radio value={false}>No</Radio>
                                        </Radio.Group>
                                    </Space>
                                }
                            >
                                <Collapse accordion>
                                    {
                                        pathDetails.map((item, index) => {
                                            return (
                                                <Panel
                                                    header={"path_rule" + (index + 1) + ': ' + item.path}
                                                    key={index}
                                                    extra={<>
                                                        <label>打分: </label>
                                                        <Input style={{ width: 30 }} size={"small"} maxLength={25} />
                                                    </>}>
                                                    <PathDetailsTabel key={index} pathData={item}></PathDetailsTabel>
                                                </Panel>
                                            )
                                        })
                                    }
                                </Collapse>
                            </Drawer>
                        </Content>
                    </Layout>

                </Layout>
            </div>
        );
    }
}


export default IndexPage;
