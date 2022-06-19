import React, { useState, useEffect } from 'react';
import { Table, Space, Badge, Tooltip, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import './index.scss'


const PathDetailsTabel = (props) => {
    const { pathList, existPaths, onMainStateChange, ontitleBtnClick } = props
    // const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [btnLoading, setBtnLoading] = useState(false);
    const [pathsDetails, setPathsDetails] = useState({});

    const openPathDetail = (path) => {
        const pathDetails = {
            "rulePath": path,
            "details": pathsDetails?.[path]
        }
        onMainStateChange({ drawerVisible: true, pathDetails })
    }

    let tabelData = pathList.map((item, index) => {
        return {
            "key": item.path,
            "path": item.path,
            "sorce": item.weight,
            "color": item.color
        }
    })
    const columns = [
        {
            title: 'RulePath',
            dataIndex: 'path',
            key: 'path',
            width: '50%'
        },
        {
            title: '置信度',
            dataIndex: 'sorce',
            key: 'sorce',
            render: (_, { sorce, color }) => {
                return (
                    <Badge count={sorce} style={{ backgroundColor: color }} />
                )
            },
            width: '20%'
        },
        {
            title: '命中条数',
            dataIndex: '',
            key: 'hit_count',
            render: (_, { path }) => (
                <div className='badge-hitpath'>{existPaths[path] ? existPaths[path] : 0}</div>
            ),
        },
        {
            title: '详情',
            dataIndex: '',
            key: 'detail',
            render: (_, { path }) => (
                <Tooltip placement="bottom" title={"查看命中路径详情"}>
                    <EyeOutlined onClick={() => openPathDetail(path)} />
                </Tooltip>

            ),
        },
    ];
    const handleTitleBtnClick = event => {
        setBtnLoading(true)
        ontitleBtnClick(event).then(({ existPathsDetails }) => {
            setBtnLoading(false)
            setPathsDetails(existPathsDetails)
        })
    }
    const tabelTitle = () => (
        <div className='pathTabel-head'>
            <span className='pathTabel-head-title'>规则路径</span>
            <Button onClick={(event) => handleTitleBtnClick(event)} loading={btnLoading}>
                执行预测
            </Button>
        </div>
    )

    // const onSelectChange = (newSelectedRowKeys) => {
    //     console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    //     setSelectedRowKeys(newSelectedRowKeys);
    // };
    // const rowSelection = {
    //     selectedRowKeys,
    //     onChange: onSelectChange,
    // };
    // useEffect(() => {
    //     setSelectedRowKeys(pathList.map(item => item.path));
    // }, [pathList])
    return (
        <Table
            title={tabelTitle}
            columns={columns}
            dataSource={tabelData}
            scroll={{ y: 500 }}
            size={'small'}
            pagination={false}
        />
    );
};

export default PathDetailsTabel;