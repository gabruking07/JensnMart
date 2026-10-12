<<<<<<< HEAD
/** Optional Create React App performance-measurement helper. */

/** Loads the web-vitals package only when a callback is supplied, then reports browser performance measurements. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;