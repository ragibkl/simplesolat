import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ReactNode,
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from "react";

type ProviderProps = {
  children: ReactNode | ReactNode[];
};

export function createDataStore<T>(dataKey: string, initialValue: T) {
  let changeListeners: (() => Promise<void>)[] = [];

  async function emitChange() {
    await Promise.all(changeListeners.map((listener) => listener()));
  }

  async function saveInner(data: T): Promise<void> {
    const json = JSON.stringify(data);
    await AsyncStorage.setItem(dataKey, json);
  }

  async function save(data: T): Promise<void> {
    await saveInner(data);
    emitChange();
  }

  async function loadRaw(): Promise<string | null> {
    const json = await AsyncStorage.getItem(dataKey);
    return json || null;
  }

  async function load(): Promise<T> {
    const json = await AsyncStorage.getItem(dataKey);
    if (!json) {
      return initialValue;
    }
    return JSON.parse(json) as T;
  }

  const DataContext = createContext<T>(initialValue);
  const SetDataContext = createContext<(d: T) => void>((_d) => {});

  function Provider(props: ProviderProps) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [dataRaw, setDataRaw] = useState<string | null>(null);

    const data = useMemo(() => {
      if (dataRaw) {
        return JSON.parse(dataRaw) as T;
      } else {
        return initialValue;
      }
    }, [dataRaw]);

    const loadDataToState = useCallback(async () => {
      const dataRawLoad = await loadRaw();
      setDataRaw(dataRawLoad);
      setIsLoading(false);
    }, []);

    useEffect(() => {
      loadDataToState();
    }, [loadDataToState]);

    useEffect(() => {
      changeListeners.push(loadDataToState);
      return () => {
        changeListeners = changeListeners.filter((l) => l !== loadDataToState);
      };
    }, [loadDataToState]);

    // NOTE: Assumes a single Provider instance per store. setData updates
    // React state directly without emitChange, so other Provider instances
    // would not be notified. External saves (e.g. from widget/service layer)
    // still go through save() → emitChange() and are unaffected.
    const setData = useCallback((newData: T) => {
      setDataRaw(JSON.stringify(newData));
      saveInner(newData);
    }, []);

    return (
      <DataContext.Provider value={data}>
        <SetDataContext.Provider value={setData}>
          {isLoading ? <></> : props.children}
        </SetDataContext.Provider>
      </DataContext.Provider>
    );
  }

  function use() {
    const data = useContext(DataContext);
    const setData = useContext(SetDataContext);

    return { data, setData };
  }

  return {
    load,
    save,
    Provider,
    use,
  };
}
