import React, { useState, useEffect, useRef } from 'react';
import { Checkbox, Select, Table } from 'antd';
import { head, calcList, table } from '../table';
import './index.css';
const DataList = () => {
  const [tableData, setTableData] = useState(table);
  const [checkList, setCheckList] = useState([]);
  const [footerData, setFooterData] = useState([]);
  const [selectValue, setSelectValue] = useState('');
  const workerListRef = useRef([]);
  const dataMapRef = useRef({});

  // 初始化数据 Worker
  useEffect(() => {
    const dataWorker = new Worker(new URL('../../worker/dataWorker.js', import.meta.url));
    dataWorker.postMessage(table);
    dataWorker.onmessage = (e) => {
      dataWorker.terminate();
      setTableData(prev => [...prev, ...e.data]);
      getDataMap(e.data);
    };

    return () => {
      clearWorkers();
    };
  }, []);

  // 计算 Worker 管理
  const makeWorker = (calcInfo) => {
    const worker = new Worker(new URL('../../worker/calcWorker.js', import.meta.url));
    const start = performance.now();

    worker.postMessage(calcInfo);
    worker.onmessage = (e) => {
      worker.terminate();
      setFooterData(prev => 
        prev.map(data => 
          data[0] === e.data[0] ? e.data : data
        )
      );

      const end = performance.now();
      console.log(`任务: ${e.data[0]}, 耗时: ${end - start}ms`);
    };

    workerListRef.current.push(worker);
  };

  // 清理 Workers
  const clearWorkers = () => {
    workerListRef.current.forEach(worker => worker.terminate());
    workerListRef.current = [];
  };

  // 计算类型变化处理
  const handleCalcChange = (selectedTypes) => {
    setCheckList(selectedTypes);
    
    // 计算新增或删除的计算类型
    const currentFooterTypes = footerData.map(item => item[0]);
    const newType = selectedTypes.find(type => !currentFooterTypes.includes(type));
    const removedType = currentFooterTypes.find(type => !selectedTypes.includes(type));

    if (newType) {
      // 添加新的统计类型
      setFooterData(prev => [...prev, [newType]]);
      
      // 触发 Worker 计算
      makeWorker({
        calcType: calcList.find(item => item.title === newType),
        columnList: head.filter(item => item.Alias !== 'key'),
        dataMap: dataMapRef.current,
        selectValue
      });
    } else if (removedType) {
      // 移除统计类型
      setFooterData(prev => prev.filter(item => item[0] !== removedType));
    }
  };

  // 渲染逻辑
  return (
    <div className="data-list">
      <div className="calc-list">
        <Checkbox.Group 
          options={calcList.map(item => item.title)} 
          value={checkList}
          onChange={handleCalcChange}
        />
        <Select 
          placeholder="加权因子"
          disabled={!checkList.includes('加权平均')}
          onChange={setSelectValue}
        >
          {head.filter(item => item.Alias !== 'key').map(item => (
            <Select.Option key={item.Alias} value={item.Alias}>
              {item.title}
            </Select.Option>
          ))}
        </Select>
      </div>
      <Table 
          columns={head.map(item => ({
            title: item.title,
            dataIndex: item.Alias,
            key: item.Alias,
            width: item.width || 150,
            fixed: item.fixed ? 'left' : undefined  
          }))}
          dataSource={tableData}
          pagination={false} // 关闭分页，显示全部数据
          scroll={{ x: 'max-content', y: 'calc(100vh - 200px)' }} // 支持横向和纵向滚动
          footer={() => footerData.map(item => item[0]).join(', ')}
        />
    </div>
  );
};

export default DataList;