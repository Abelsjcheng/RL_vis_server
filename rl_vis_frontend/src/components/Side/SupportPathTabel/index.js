import React, { useState, useEffect } from 'react';
import { Table, Space, Badge, Tooltip, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import './index.scss'


const SupportPathTabel = (props) => {
    const { pathList } = props
    // const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    let tabelData = pathList.map((item, index) => {
        return {
            "index": index +1,
            "key": item.path,
            "path": item.path,
            "sorce": item.weight,
            "color": item.color
        }
    })
    const columns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
            width: '15%'
        },
        {
            title: 'RulePath',
            dataIndex: 'path',
            key: 'path'
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
    ];
    const tabelTitle = () => (
        <span className='pathTabel-head-title'>支持规则集</span>
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

export default SupportPathTabel;