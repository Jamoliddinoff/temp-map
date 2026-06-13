import { App as AntApp, ConfigProvider } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import GisMap from './components/GisMap'

function App() {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{ token: { colorPrimary: '#1D4ED8', borderRadius: 8 } }}
    >
      <AntApp>
        <GisMap />
      </AntApp>
    </ConfigProvider>
  )
}

export default App
