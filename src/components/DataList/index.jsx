import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDataGrid from 'react-data-grid';
import { Checkbox, Select } from 'antd';
import { head, calcList, table } from '../table';
import './index.css';
import 'react-data-grid/lib/styles.css';

const DataList = () => {
  const [tableData, setTableData] = useState(table);
  const [checkList, setCheckList] = useState([]);
  const [footerData, setFooterData] = useState([]);
  const [selectValue, setSelectValue] = useState('');
  const [dataMap, setDataMap] = useState({});
  const workerListRef = React.useRef([]);

  // 列定义
  const columns = useMemo(
    () =>
      head.map((item) => ({
        key: item.Alias,
        name: item.title,
        resizable: true,
        width: item.width || 150,
        frozen: item.fixed,
      })),
    [head],
  );

  // 初始化数据 Worker
  useEffect(() => {
    const dataWorker = new Worker(
      new URL('../../worker/dataWorker.js', import.meta.url),
    );

    dataWorker.postMessage(table);
    dataWorker.onmessage = (e) => {
      dataWorker.terminate();
      setTableData((prev) => prev.concat(e.data));
      getDataMap(e.data);
    };

    return () => {
      dataWorker.terminate();
    };
  }, []);

  // 获取数据映射
  const getDataMap = useCallback(
    (newData) => {
      const selectOptions = head.filter((item) => item.Alias !== 'key');
      const newDataMap = {};
      selectOptions.forEach((item) => {
        newDataMap[item.Alias] = tableData
          .concat(newData)
          .map((val) => val[item.Alias]);
      });
      setDataMap(newDataMap);
    },
    [tableData],
  );

  // 创建计算 Worker
  const makeWorker = useCallback((calcInfo) => {
    const worker = new Worker(
      new URL('../../worker/calcWorker.js', import.meta.url),
    );

    const start = performance.now();
    worker.postMessage(calcInfo);

    worker.onmessage = (e) => {
      worker.terminate();

      setFooterData((prev) => {
        const newFooterData = [...prev];
        const existIndex = newFooterData.findIndex(
          (data) => data[0] === e.data[0],
        );

        if (existIndex !== -1) {
          newFooterData[existIndex] = e.data;
        } else {
          newFooterData.push(e.data);
        }

        return newFooterData;
      });

      const end = performance.now();
      console.log(`当前任务: ${e.data[0]}, 计算用时: ${end - start} 毫秒`);
    };

    workerListRef.current.push(worker);
  }, []);

  const handleCheckboxChange = useCallback(
    (selectedTypes) => {
      console.log('选中的计算类型:', selectedTypes);

      setCheckList(selectedTypes);

      // 获取当前已存在的统计类型
      const currentFooterTypes = footerData.map((item) => item[0]);
      console.log('当前统计类型:', currentFooterTypes);

      // 找出新增或删除的类型
      const newType = selectedTypes.find(
        (type) => !currentFooterTypes.includes(type),
      );
      const removedType = currentFooterTypes.find(
        (type) => !selectedTypes.includes(type),
      );

      console.log('新增类型:', newType);
      console.log('删除类型:', removedType);

      if (newType) {
        // 添加新的统计类型
        setFooterData((prev) => [...prev, [newType]]);

        // 触发 Worker 计算
        const calcType = calcList.find((item) => item.title === newType);
        console.log('计算类型详情:', calcType);

        makeWorker({
          calcType,
          columnList: head.filter((item) => item.Alias !== 'key'),
          dataMap,
          selectValue,
        });
      } else if (removedType) {
        // 移除统计类型
        setFooterData((prev) => prev.filter((item) => item[0] !== removedType));
      }

      console.log('最终 footerData:', footerData);
    },
    [footerData, makeWorker, dataMap, selectValue],
  );

  // 处理加权因子变化
  const handleSelectChange = useCallback(
    (val) => {
      setSelectValue(val);

      // 如果已经选择了加权平均，重新计算
      if (checkList.includes('加权平均')) {
        makeWorker({
          calcType: calcList.find((item) => item.title === '加权平均'),
          columnList: head.filter((item) => item.Alias !== 'key'),
          dataMap,
          selectValue: val,
        });
      }
    },
    [checkList, makeWorker, dataMap],
  );

  return (
    <div className="data-list">
      <div className="calc-list">
        <div className="calc-tip">选择表格的计算类型</div>
        <Checkbox.Group value={checkList} onChange={handleCheckboxChange}>
          {calcList.map((item) => (
            <Checkbox key={item.type} value={item.title}>
              {item.title}
            </Checkbox>
          ))}
        </Checkbox.Group>

        <Select
          value={selectValue}
          placeholder="选择加权因子"
          disabled={!checkList.includes('加权平均')}
          onChange={handleSelectChange}
          style={{ width: 110, marginLeft: 10 }}
        >
          {head
            .filter((item) => item.Alias !== 'key')
            .map((item) => (
              <Select.Option key={item.Alias} value={item.Alias}>
                {item.title}
              </Select.Option>
            ))}
        </Select>
      </div>

      <div className="table-list"  >
        <ReactDataGrid
          columns={columns}
          rows={tableData}
          rowHeight={35}
          headerRowHeight={40}
          enableVirtualization={true}
          
        />
        {footerData.length > 0 && (
          <div className="statistics-summary">
            {footerData.map((data, index) => (
              <div key={index} className="stat-item">
                {data.join(', ')}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataList;
