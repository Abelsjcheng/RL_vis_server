
import React from 'react';
import { Spin, message, Layout } from 'antd';
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
            kgRef: null
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
        const { kgData, curTriple, isLoaded, kgRef } = this.state
        return (
            <div className="App">
                <Layout>
                    <Sider style={{ background: '#fff', position: 'fixed', left: 0, top: 0, bottom: 0, overflow: 'auto' }} width={300}>
                        <div className='rl-title'>RL关系预测</div>
                        <SidePanel getKgRef={kgRef} kgData={kgData} curTriple={curTriple}  ></SidePanel>
                    </Sider>
                    <Layout style={{ marginLeft: '300px' }}>
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
                            }}
                        >
                            <div
                                className="rl-view-content"
                                style={{
                                    minHeight: 600,
                                }}
                            >
                                {isLoaded ? <Kg onRef={ref => (this.setState({ kgRef: ref }))} kgData={kgData} curTriple={curTriple} ></Kg> : <Spin size="large" />}
                            </div>
                        </Content>
                    </Layout>

                </Layout>
            </div>
        );
    }
}


export default IndexPage;
