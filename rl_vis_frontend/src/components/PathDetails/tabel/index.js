import React, { useState } from 'react';
import { Table, Tag, Space, Input, Tooltip } from 'antd';
import { splitLinkName, splitNodeName } from '../../../util/tool'
import { EyeOutlined } from '@ant-design/icons';
import './index.scss'


const PathDetailsTabel = (props) => {
    const { pathData } = props

    let data = []
    data = pathData.details?.map((item, index) => {
        return {
            "key": index,
            "path": item,
        }
    })
    const columns = [
        {
            title: 'ground path',
            dataIndex: 'path',
            key: 'path',
            "render": (paths) => {
                const rels = pathData.rulePath.split(" -> ")
                return (
                    <>
                        {
                            paths.map((entity, index) => {
                                if (index < rels.length) {
                                    return (
                                        <div key={index} className='tabel-cell-action'>
                                            <span>{splitNodeName(entity)}</span>
                                            <div className='tabel-cell-relation'>
                                                <span>{splitLinkName(rels[index])}</span>
                                                <span>———&gt;</span>
                                            </div>
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div key={index} className='tabel-cell-action'>
                                            <span>{splitNodeName(entity)}</span>
                                        </div>
                                    )
                                }

                            })
                        }
                    </>
                )
            },
            width: '90%',
        },
        {
            title: '打分',
            dataIndex: '',
            key: 'sorce',
            render: (_, record) => (
                <Input style={{ width: 30 }} size={"small"} maxLength={10} />
            ),
        },
        {
            title: '操作',
            dataIndex: '',
            key: 'action',
            render: (_, { path }) => (
                <Tooltip placement="bottom" title={"查看当前路径"}>
                    <EyeOutlined  />
                </Tooltip>

            ),
        }
    ];
    // const [visible, setVisible] = useState(false);
    // const [placement, setPlacement] = useState('right');
    const tabelTitle = () => `规则路径: ${pathData.rulePath}`
    return (
        <Table title={tabelTitle} columns={columns} dataSource={data} scroll={{ y: 190 }} size={'small'} />
    );
};

export default PathDetailsTabel;