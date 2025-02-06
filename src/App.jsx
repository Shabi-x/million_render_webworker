import React, { useState } from 'react';
import { Radio } from 'antd';  
// import DataList from './components/DataList';
// import CanvasDemo from './components/CanvasDemo';
import './App.css'; 

function App() {
  const [radio, setRadio] = useState(1);

  const handleRadioChange = (e) => {
    setRadio(e.target.value);
  };

  return (
    <div id="app">
      <div className="changeRadio">
        <Radio.Group 
          value={radio} 
          onChange={handleRadioChange}
          style={{ 
            margin: '0 auto', 
            display: 'flex', 
            justifyContent: 'center' 
          }}
        >
          <Radio value={1}>表格计算示例</Radio>
          <Radio value={2}>canvas绘制示例</Radio>
        </Radio.Group>
      </div>

      {/* {radio === 1 && <DataList />}
      {radio === 2 && <CanvasDemo />} */}
    </div>
  );
}

export default App;