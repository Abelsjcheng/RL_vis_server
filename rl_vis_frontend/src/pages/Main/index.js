
import React from 'react';
import { Spin, message, Layout, Row, Col } from 'antd';
import Kg from '../../components/Kg/index'
import SidePanel from '../Side/index'
import HeaderPanel from '../Header/index'
import './index.scss'
const { Header, Content, Sider } = Layout;

class IndexPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            kgData: null,
            isLoaded: false,
            curTriple: null,
            kgRef: null,
            extraSubGraphs: [],
            extrakgRefs: {}
        };
    }
    componentDidMount() {

    }
    componentDidUpdate(prevProps, prevState) {

    }
    handelMainStateChange = (nextstates) => {
        this.setState(nextstates)
    }
    render() {
        const { kgData, curTriple, isLoaded, kgRef, extraSubGraphs, extrakgRefs } = this.state
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
                                overflow: 'initial'
                            }}
                        >
                            <div
                                className="rl-view-content"
                                style={{
                                    minHeight: 600,
                                }}
                            >
                                {isLoaded ? <Kg onRef={ref => (this.setState({ kgRef: ref }))} kgData={kgData} curTriple={curTriple} ></Kg> : <Spin size="large" />}
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
                        </Content>
                    </Layout>

                </Layout>
            </div>
        );
    }
}


export default IndexPage;
