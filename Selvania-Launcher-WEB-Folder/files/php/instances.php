<?php
$instance['valerium'] = array_merge($instance['valerium'], array(
    "loadder" => array(
        "minecraft_version" => "1.7.10",
        "loadder_type" => "forge",
        "loadder_version" => "1.7.10-10.13.4.1614-1.7.10"
    ),
    "verify" => true,
    "ignored" => array(
        options.txt,
        optionsof.txt,
        resourcepacks,
        saves,
        screenshots,
        shaderpacks
    ),
    "whitelist" => array(
        MidacoYT,
        Astrolith
    ),
    "whitelistActive" => true,
    "status" => array(
        "nameServer" => "Valerium",
        "ip" => "89.213.131.63",
        "port" => 25732
    )
));
?>
