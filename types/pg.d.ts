declare module 'pg' {
  const pg: {
    Pool: new (config?: any) => any;
  };
  export default pg;
}
