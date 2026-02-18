export interface Printer {
  assetId: string;
  namePrinter: string;
  departmentId: string;
  unitId: string;
  regionId: string;
  printerStatus: string;
  tonerLvl: number;
  kitMttnceLvl: number;
  uniImgLvl: number;
  totalPagesPrinted: number;
  lastReadAt: string;
}
