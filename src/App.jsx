import React, { useState } from 'react';
import { Radio } from 'antd';  
import DataList from './components/DataList';
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
            display: 'flex', 
            justifyContent: 'center' ,
            alignItems: 'center'
          }}
        >
          <Radio value={1}>表格计算示例</Radio>
        </Radio.Group>
      </div>

      {radio === 1 && <DataList />}
    </div>
  );
}

export default App;