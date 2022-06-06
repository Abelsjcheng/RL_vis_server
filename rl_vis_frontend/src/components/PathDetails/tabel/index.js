import React, { useState } from 'react';
import { Table, Tag, Space } from 'antd';
import { splitLinkName, splitNodeName } from '../../../util/tool'
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
            title: 'Path',
            dataIndex: 'path',
            key: 'path',
            "render": (paths) => {
                const rels = pathData.path.split(" -> ")
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
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <a>查看</a>
            ),
        },
    ];
    // const [visible, setVisible] = useState(false);
    // const [placement, setPlacement] = useState('right');

    return (
        <Table columns={columns} dataSource={data} scroll={{ y: 240 }} size={'small'} />
    );
};

export default PathDetailsTabel;