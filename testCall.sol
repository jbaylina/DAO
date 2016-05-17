contract CMaster {

    struct Item {
        uint a;
        string s;
        uint b;
    }

    Item[] public items;

    function CMaster() {
        items.length = 1;
        var item = items[0];
        item.a=11;
        item.b=22;
        item.s="This is a quite long string regwegwjehgwjett w t gwe tg eit geri tetig eurtg ertiug eri ";
    }
}

0xbfb231d2
00000000000000000000000000000000
00000000000000000000000000000000
contract CSlave {

    function extractFromMaster(address _cMasterAddr) returns(uint _a, string _s, uint _b) {
/*        uint[] memory outBuff = new uint[](32);
        uint[] memory inBuff = new uint[](2);
        inBuff[0] = 0xbfb231d2;
        inBuff[1] = 2;
        assembly {
            let inSize := mul(mload(inBuff),32)
            let inOf := add(inBuff, 32)
            let outSize := mul(mload(outBuff),32)
            let outOf := add(outBuff, 32)
            call(gas,cMaster,0,inOf,inSize,outOf,outSize)
            let rb := mload(add(outOf, 64))
            mstore(b, rb)
        }
*/

        CMaster cMaster = CMaster(_cMasterAddr);
        var (a, /* s,*/ b) = cMaster.items(0);

        _a = a;
//        _s = s;
        _b = b;
    }
}
