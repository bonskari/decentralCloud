
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Storage {
    struct FileInfo {
        string fileName;
        uint fileSize;
        string uploadDate;
        string fragmentHashes; // Storing as a comma-separated string for simplicity
    }

    mapping(uint => FileInfo) public files;
    uint public fileCount;

    function addFile(string memory _fileName, uint _fileSize, string memory _uploadDate, string memory _fragmentHashes) public {
        fileCount++;
        files[fileCount] = FileInfo(_fileName, _fileSize, _uploadDate, _fragmentHashes);
    }

    function getFile(uint _index) public view returns (string memory, uint, string memory, string memory) {
        FileInfo storage fileInfo = files[_index];
        return (fileInfo.fileName, fileInfo.fileSize, fileInfo.uploadDate, fileInfo.fragmentHashes);
    }

    function getAllFiles() public view returns (string[] memory, uint[] memory, string[] memory, string[] memory) {
        string[] memory fileNames = new string[](fileCount);
        uint[] memory fileSizes = new uint[](fileCount);
        string[] memory uploadDates = new string[](fileCount);
        string[] memory fragmentHashes = new string[](fileCount);

        for (uint i = 1; i <= fileCount; i++) {
            FileInfo storage fileInfo = files[i];
            fileNames[i - 1] = fileInfo.fileName;
            fileSizes[i - 1] = fileInfo.fileSize;
            uploadDates[i - 1] = fileInfo.uploadDate;
            fragmentHashes[i - 1] = fileInfo.fragmentHashes;
        }
        return (fileNames, fileSizes, uploadDates, fragmentHashes);
    }
}
