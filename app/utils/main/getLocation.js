// 根据经纬度获取地址信息（高德地图API，获取district, adcode）

import axios from "axios";

// 地理位置获取
async function getLocation(longitude, latitude) {
  try {
    // 高德地图API规定经纬度小数点后不超过6位，这里做一下处理
    longitude = parseFloat(Number(longitude).toFixed(6));
    latitude = parseFloat(Number(latitude).toFixed(6));
    const result = await axios({
      url: `https://restapi.amap.com/v3/geocode/regeo?key=3385a85d1893969400b355806e3032bd&location=${longitude},${latitude}`,
      method: "GET",
    });
    return result?.data;
  } catch (error) {
    console.error("Error getting geolocation:", error);
    throw error;
  }
}

// 获取用户区域位置
async function getDistrict(longitude, latitude) {
  try {
    // 调用地理位置获取接口
    const data = await getLocation(longitude, latitude);
    // console.log(data);
    if (data?.status === "1") {
      const address = data?.regeocode?.addressComponent;
      if (address) return { district: address.district, adcode: address.adcode };
    }
    console.error("Error getting geolocation:", data.info);
    return null;
  } catch (error) {
    console.error("Error getting geolocation:", error);
    throw error;
  }
}

export default getDistrict;
